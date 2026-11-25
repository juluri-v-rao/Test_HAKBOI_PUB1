using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel;
using HAKOBIMASENKA.Repository.CharteredVehicleMasterRepository;

namespace HAKOBIMASENKA.Service.CharteredVehicleMasterService
{
    /// <summary>
    /// 傭車マスタ rules (legacy FrmM_Yosha).
    /// </summary>
    public class CharteredVehicleMasterService : ICharteredVehicleMasterService
    {
        private const int CodeLength = 10;

        private readonly ICharteredVehicleMasterRepository _repository;

        // 入力端末: this terminal's number (legacy E_CODE), as 品名マスタ / 品名区分マスタ
        private readonly string _terminalCode;

        public CharteredVehicleMasterService(ICharteredVehicleMasterRepository repository, IConfiguration configuration)
        {
            _repository = repository;
            _terminalCode = configuration["Terminal:ClientNo"] ?? "01";
        }

        // =========================================
        //              Load / Codes
        // =========================================

        // Dsp_Data + Dsp_List: the 傭車 with both histories.
        public async Task<CharteredVehicleMasterViewModel?> GetByCodeAsync(string code)
        {
            code = PadCode(code, CodeLength);

            var model = await _repository.GetByCodeAsync(code);

            if (model != null)
            {
                model.支払履歴 = await _repository.GetHistoryAsync(code, payment: true);
                model.買掛履歴 = await _repository.GetHistoryAsync(code, payment: false);
            }

            return model;
        }

        public Task<bool> ExistsAsync(string code)
        {
            return _repository.ExistsAsync(PadCode(code, CodeLength));
        }

        public async Task<string> GetNextGeneratedCodeAsync()
        {
            var next = await _repository.GetMaxCodeAsync() + 1;

            return next >= 10_000_000_000 ? "" : next.ToString().PadLeft(CodeLength, '0');
        }

        public Task<string?> GetPreviousCodeAsync(string code)
        {
            return _repository.GetPreviousCodeAsync(PadCode(code, CodeLength));
        }

        public Task<string?> GetNextCodeAsync(string code)
        {
            return _repository.GetNextCodeAsync(PadCode(code, CodeLength));
        }

        // =========================================
        //              Lookups
        // =========================================

        public Task<string?> FindSettlementNameAsync(string code, bool isNewRecord)
        {
            return _repository.FindSettlementNameAsync(PadCode(code, CodeLength), activeOnly: isNewRecord);
        }

        public Task<IEnumerable<CharteredVehicleMasterResultDto>> GetUnitsAsync()
        {
            return _repository.GetUnitsAsync();
        }

        public Task<IEnumerable<CharteredVehicleMasterResultDto>> GetPaymentMethodsAsync()
        {
            return _repository.GetPaymentMethodsAsync();
        }

        public Task<string?> FindAddressAsync(string postalCode)
        {
            // 郵便番号マスタ holds the code without the hyphen (legacy Dsp_Post).
            return _repository.FindAddressAsync((postalCode ?? "").Replace("-", "").Trim());
        }

        public Task<CharteredVehicleDefaultsDto> GetDefaultsAsync()
        {
            return _repository.GetDefaultsAsync();
        }

        // =========================================
        //          Save (Input_Chk + Data_Repl)
        // =========================================

        public async Task<(string? Message, string? Field)> SaveAsync(CharteredVehicleMasterViewModel model)
        {
            Normalize(model);

            var error = await CheckAsync(model);
            if (error.Message != null)
            {
                return error;
            }

            await _repository.SaveAsync(model, _terminalCode);

            return (null, null);
        }

        // Same checks and messages as legacy Input_Chk, in the same order.
        // The screen runs them first; these stop a request that skipped the screen.
        // Legacy Data_Repl is insert-or-update, and Input_Chk does not check the code is free,
        // the 締め日 range, nor that 精算区分 / 支払方法 exist (only LostFocus does): those are saved as typed.
        private async Task<(string? Message, string? Field)> CheckAsync(CharteredVehicleMasterViewModel m)
        {
            if (m.傭車コード == "" || m.傭車コード.Length > CodeLength || !m.傭車コード.All(char.IsAsciiDigit))
                return ("傭車コードを入力して下さい。", "傭車コード");

            if (m.傭車名1 == "")
                return ("傭車名を入力して下さい。", "傭車名1");

            if (m.ふりがな == "")
                return ("フリガナを入力して下さい。", "ふりがな");

            if (m.略称 == "")
                return ("略称を入力して下さい。", "略称");

            if (m.締め日 == "")
                return ("締め日を入力して下さい。", "締め日");

            if (m.精算先コード == "")
                return ("精算先を入力して下さい。", "精算先コード");

            if (m.精算先コード != m.傭車コード &&
                await _repository.FindSettlementNameAsync(m.精算先コード!, activeOnly: m.IsNewRecord) == null)
                return ("精算先を正しく入力して下さい。", "精算先コード");

            if (m.精算区分 == "")
                return ("精算区分を入力して下さい。", "精算区分");

            if (m.支払サイト != "" && !InRange(m.支払サイト, 0, 9))
                return ("支払サイトを正しく入力してください！！", "支払サイト");

            if (m.支払日 != "" && !InRange(m.支払日, 1, 31))
                return ("支払日を正しく入力してください！！", "支払日");

            if (m.支払条件 != 0 && m.支払方法2 == "")
                return ("支払方法2を正しく入力してください！！", "支払方法2");

            if (m.口座種別 != "" && m.口座種別 is not ("0" or "1"))
                return ("口座種別を正しく入力して下さい。", "口座種別");

            var options = new (string? Value, string[] Allowed, string Label, string Field)[]
            {
                (m.端数桁数, ["0", "1", "2"], "端数桁数", "端数桁数"),
                (m.下払端数, ["0", "1", "2"], "下払端数", "下払端数"),
                (m.税区分, ["0", "1", "2"], "消費税区分", "税区分"),
                (m.税端数, ["0", "1", "2"], "消費税端数", "税端数"),
                (m.値引課税, ["0", "1"], "課税割増", "値引課税"),
                (m.値引非課税, ["0", "1"], "非課税割増", "値引非課税"),
                (m.値引端数, ["0", "1", "2"], "値引端数", "値引端数"),
                (m.支払日設定, ["0", "1", "2"], "支払日設定", "支払日設定"),
            };

            foreach (var option in options)
            {
                if (option.Value == "")
                    return ($"{option.Label}を入力して下さい。", option.Field);

                if (!option.Allowed.Contains(option.Value))
                    return ($"{option.Label}を正しく入力して下さい。", option.Field);
            }

            // Legacy number boxes cannot hold anything outside these ranges.
            if (m.値引率 is < -99.99m or > 100m)
                return ("値引率を正しく入力して下さい。", "値引率");

            if (m.数量小数点 is < 0 or > 3)
                return ("数量小数点を正しく入力して下さい。", "数量小数点");

            if (m.重量小数点 is < 0 or > 3)
                return ("重量小数点を正しく入力して下さい。", "重量小数点");

            if (m.小数点 is < 0 or > 2)
                return ("単価小数点を正しく入力して下さい。", "小数点");

            var historyError = await CheckHistoryAsync(m.支払履歴, payment: true)
                               ?? await CheckHistoryAsync(m.買掛履歴, payment: false);

            if (historyError != null)
                return (historyError, null);

            return (null, null);
        }

        // Input_Chk2 for every history row, plus the legacy number box ranges.
        private async Task<string?> CheckHistoryAsync(List<CharteredVehicleHistoryDto>? rows, bool payment)
        {
            if (rows == null) return null;

            foreach (var row in rows)
            {
                if (row.更新日.Year < 1900)
                    return "終了日が不正です正しく入力して下さい！！";

                if (row.開始日 != null && row.開始日 > row.更新日)
                    return "期間が不正です日付を正しく入力して下さい！！";

                var amounts = new[]
                {
                    row.前回買掛額, row.今回支払額, row.今回調整額, row.今回仕入額, row.今回割増額,
                    row.今回非割増, row.課税値引額, row.非課税値引, row.今回消費税
                };

                if (amounts.Any(amount => amount is < -999_999_999m or > 999_999_999m))
                    return "金額を正しく入力して下さい！！";

                if (payment && row.支払方法 != "" &&
                    !await _repository.PaymentMethodExistsAsync(row.支払方法!))
                    return $"指定した支払方法『{row.支払方法}』は未登録です！！";
            }

            if (rows.GroupBy(row => row.更新日).Any(group => group.Count() > 1))
                return "終了日が不正です正しく入力して下さい！！";

            return null;
        }

        // Legacy writes '' (never NULL) for empty text, pads the codes, and 0 for empty numbers.
        private static void Normalize(CharteredVehicleMasterViewModel m)
        {
            m.傭車コード = PadCode(m.傭車コード, CodeLength);
            m.傭車名1 ??= "";
            m.傭車名2 ??= "";
            m.ふりがな ??= "";
            m.略称 ??= "";
            m.郵便 ??= "";
            m.住所1 ??= "";
            m.住所2 ??= "";
            m.電話番号 ??= "";
            m.FAX番号 ??= "";
            m.備考 ??= "";
            m.MAIL ??= "";
            m.締め日 = PadCode(m.締め日, 2);
            m.精算先コード = PadCode(m.精算先コード, CodeLength);
            m.精算区分 = (m.精算区分 ?? "").Trim();
            m.支払サイト = (m.支払サイト ?? "").Trim();
            m.支払日 = PadCode(m.支払日, 2);
            m.支払方法1 = PadCode(m.支払方法1, 2);
            m.支払条件 ??= 0;
            m.支払方法2 = PadCode(m.支払方法2, 2);
            m.銀行名 ??= "";
            m.支店名 ??= "";
            m.口座種別 = (m.口座種別 ?? "").Trim();
            m.口座番号 ??= "";
            m.口座名義 ??= "";
            m.端数桁数 = (m.端数桁数 ?? "").Trim();
            m.下払端数 = (m.下払端数 ?? "").Trim();
            m.税区分 = (m.税区分 ?? "").Trim();
            m.税端数 = (m.税端数 ?? "").Trim();
            m.値引率 ??= 0;
            m.値引課税 = (m.値引課税 ?? "").Trim();
            m.値引非課税 = (m.値引非課税 ?? "").Trim();
            m.値引端数 = (m.値引端数 ?? "").Trim();
            m.支払日設定 = (m.支払日設定 ?? "").Trim();
            m.数量小数点 ??= 0;
            m.重量小数点 ??= 0;
            m.小数点 ??= 0;
            m.単価表示 = m.単価表示 == "1" ? "1" : "0";
            m.支払残計算 = m.支払残計算 == "1" ? "1" : "0";
            m.買掛残計算 = m.買掛残計算 == "1" ? "1" : "0";
            m.デジタココード ??= "";

            // Totals are saved as sent: the screen works them out when a row is 修正'd (Cal_Rireki),
            // and rows nobody touched keep their stored totals, as legacy copied them unchanged.
            foreach (var row in (m.支払履歴 ?? []).Concat(m.買掛履歴 ?? []))
            {
                row.支払方法 = PadCode(row.支払方法, 2);
            }
        }

        // =========================================
        //          Delete (Del_Chk + Data_Del)
        // =========================================

        public Task<string?> CheckDeleteAsync(string code)
        {
            return _repository.GetDeleteBlockReasonAsync(PadCode(code, CodeLength));
        }

        public async Task<string?> DeleteAsync(string code)
        {
            code = PadCode(code, CodeLength);

            var reason = await _repository.GetDeleteBlockReasonAsync(code);
            if (reason != null)
            {
                return reason;
            }

            await _repository.DeleteAsync(code);

            return null;
        }

        // =========================================
        //              Helpers
        // =========================================

        // Legacy ZeroPad: blank stays blank, otherwise left-padded with zeros.
        private static string PadCode(string? value, int length)
        {
            var text = (value ?? "").Trim();

            return text == "" ? "" : text.PadLeft(length, '0');
        }

        private static bool InRange(string? value, int min, int max)
        {
            return int.TryParse(value, out var number) && number >= min && number <= max;
        }
    }
}
