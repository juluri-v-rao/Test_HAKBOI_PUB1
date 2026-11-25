using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ManagementMasterViewModel;
using HAKOBIMASENKA.Repository.ManagementMasterRepository.ManagementMasterRepository;

namespace HAKOBIMASENKA.Service.ManagementMasterService.ManagementMasterService
{
        public class ManagementMasterSaveResult
        {
            public bool Success { get; set; }

            public string? ErrorMessage { get; set; }

            // The model property of the field to put the cursor on (legacy Input_Chk: tab switch + Focus)
            public string? ErrorField { get; set; }

            // The tab legacy switches to, when it is not the field's own tab (the field then gets no cursor)
            public string? ErrorTab { get; set; }
        }

        public class ManagementMasterDeleteResult
        {
            public bool Success { get; set; }

            public string? ErrorMessage { get; set; }
        }

        public class ManagementMasterService(IManagementMasterRepository repository) : IManagementMasterService
        {
            private readonly IManagementMasterRepository _repository = repository;

            public Task<List<ManagementMasterResultDto>>GetListAsync()
            {
                return _repository.GetListAsync();
            }

            public Task<ManagementMasterViewModel?>GetByCodeAsync(string code)
            {
                return _repository.GetByCodeAsync(code);
            }

            public Task<bool>ExistsAsync(string code)
            {
                return _repository.ExistsAsync(code);
            }

            public Task<string?>GetNextCodeAsync()
            {
                return _repository.GetNextCodeAsync();
            }

            public async Task<ManagementMasterSaveResult> SaveAsync(ManagementMasterViewModel model, string terminalCode)
            {
                Normalize(model);

                var validation = Validate(model);

                if (validation != null)
                {
                    return validation;
                }

                await _repository.SaveAsync(model,terminalCode);

                return new ManagementMasterSaveResult
                {
                    Success = true
                };
            }

            // Del_Chk, then the 01 check, in the legacy order (F4 asks only after this passes)
            public async Task<ManagementMasterDeleteResult> CheckDeleteAsync(string companyCode)
            {
                companyCode = PadCode(companyCode);

                var reason = await _repository.GetDeleteBlockReasonAsync(companyCode);

                if (reason != null)
                {
                    return new ManagementMasterDeleteResult
                    {
                        Success = false,
                        ErrorMessage = reason
                    };
                }

                // 01 holds the system settings
                if (companyCode == "01")
                {
                    return new ManagementMasterDeleteResult
                    {
                        Success = false,
                        ErrorMessage = "自社コード『01』は削除することは出来ません！！"
                    };
                }

                return new ManagementMasterDeleteResult
                {
                    Success = true
                };
            }

            public async Task<ManagementMasterDeleteResult> DeleteAsync(string companyCode)
            {
                var check = await CheckDeleteAsync(companyCode);

                if (!check.Success)
                {
                    return check;
                }

                await _repository.DeleteAsync(PadCode(companyCode));

                return new ManagementMasterDeleteResult
                {
                    Success = true
                };
            }

            // Values as legacy stores them: 2-digit code, 対象月度 on the 1st, '' instead of NULL text
            private static void Normalize(ManagementMasterViewModel model)
            {
                model.自社コード = PadCode(model.自社コード);

                if (model.対象月度 != null)
                {
                    model.対象月度 = new DateTime(model.対象月度.Value.Year, model.対象月度.Value.Month, 1);
                }

                model.自社名1 ??= "";
                model.自社名2 ??= "";
                model.略称 ??= "";
                model.郵便番号 ??= "";
                model.住所1 ??= "";
                model.住所2 ??= "";
                model.電話番号 ??= "";
                model.faX番号 ??= "";
                model.銀行1 ??= "";
                model.銀行2 ??= "";
                model.運行管理者 ??= "";
                model.登録番号 ??= "";
                model.宛先敬称 ??= "";
                model.送信先1 ??= "";
                model.送信先2 ??= "";
                model.給与ファイル ??= "";
                model.財務ファイル ??= "";
            }

            // ZeroPad(TxtCode.Text, 2); blank stays blank
            private static string PadCode(string? code)
            {
                var text = (code ?? "").Trim();

                return text == "" ? "" : text.PadLeft(2, '0');
            }

            private static ManagementMasterSaveResult? Validate(ManagementMasterViewModel model)
            {
                //
                // 自社コード
                //
                if (string.IsNullOrWhiteSpace(model.自社コード) ||
                    model.自社コード.Length > 2 ||
                    !model.自社コード.All(char.IsAsciiDigit))
                {
                    return Error("自社コードを入力して下さい", "自社コード");
                }

                //
                // 自社名(1)
                //
                // legacy checks = "" only: a name of spaces is saved as typed
                if (string.IsNullOrEmpty(model.自社名1))
                {
                    return Error("自社名（１）が未入力です！！", "自社名1");
                }

                //
                // 略称
                //
                if (string.IsNullOrEmpty(model.略称))
                {
                    return Error("略称が未入力です！！", "略称");
                }

                //
                // 処理月度
                //
                // legacy TxtNendo MinDate / MaxDate (a date outside cannot be entered there)
                if (model.対象月度 == null || !InRange(model.対象月度, 2000))
                {
                    return Error("処理月度が未入力です！！", "対象月度");
                }

                //
                // 消費税施行日
                //
                if (model.新消費税率施行日 == null || !InRange(model.新消費税率施行日, 2000))
                {
                    return Error("消費税施行日が異常です！！", "新消費税率施行日");
                }

                //
                // 消費税率
                //
                if (model.旧消費税率 == null || model.新消費税率 == null)
                {
                    return Error("消費税率が異常です！！", model.旧消費税率 == null ? "旧消費税率" : "新消費税率");
                }

                //
                // 軽油税施行日
                //
                if (model.新軽油税施行日 == null || !InRange(model.新軽油税施行日, 1950))
                {
                    return Error("軽油税施行日が異常です！！", "新軽油税施行日");
                }

                //
                // 軽油税
                //
                if (model.旧軽油税 == null || model.新軽油税 == null)
                {
                    return Error("軽油税が異常です！！", model.旧軽油税 == null ? "旧軽油税" : "新軽油税");
                }

                //
                // 伝票番号
                //
                // the first bad one gets the cursor, in the legacy order TxtDno(1-10), across each row
                var vouchers = new (string Field, int? Value)[]
                {
                    ("受注伝票", model.受注伝票), ("運転日報", model.運転日報),
                    ("仕入伝票", model.仕入伝票), ("入金伝票", model.入金伝票),
                    ("傭車伝票", model.傭車伝票), ("仕入支払", model.仕入支払),
                    ("経費伝票", model.経費伝票), ("支払伝票", model.支払伝票),
                    ("作業伝票", model.作業伝票), ("予約番号", model.予約番号)
                };

                foreach (var voucher in vouchers)
                {
                    if (!IsValidVoucher(voucher.Value))
                    {
                        return Error("伝票番号が異常です！！", voucher.Field);
                    }
                }

                //
                // 売上端数
                //

                if (!IsValidThreeOption(model.売上端数))
                {
                    return Error(
                        "売上端数が異常です！！", "売上端数");
                }

                //
                // 消費税区分
                //
                if (!IsValidThreeOption(model.消費税区分))
                {
                    return Error(
                        "消費税区分が異常です！！", "消費税区分");
                }

                //
                // 消費税端数
                //
                if (!IsValidThreeOption(model.消費税端数))
                {
                    return Error(
                        "消費税端数が異常です！！", "消費税端数");
                }

                //
                // クライアントNo
                //
                if (string.IsNullOrWhiteSpace(model.顧客No))
                {
                    return Error(
                        "クライアントNo.が未入力です！！", "顧客No");
                }

                //
                // サーバーパス
                //
                if (string.IsNullOrWhiteSpace(model.サーバーパス))
                {
                    return Error(
                        "サーバーパスが未入力です！！", "サーバーパス");
                }

                //
                // 発着地登録
                //
                if (!IsValidOption(model.発着地区分))
                {
                    return Error(
                        "発着地登録が異常です！！", "発着地区分");
                }

                //
                // 日付
                //
                if (!IsValidOption(model.日付区分))
                {
                    return Error(
                        "日付が異常です！！", "日付区分");
                }

                //
                // 部門管理
                //
                if (!IsValidThreeOption(model.部門管理))
                {
                    return Error(
                        "部門管理が異常です！！", "部門管理");
                }

                //
                // 宛先敬称
                //
                // VB:
                // Separate_Chara(text,4)
                // 全角2文字まで
                //
                if (!string.IsNullOrWhiteSpace(model.宛先敬称))
                {
                    // 4 bytes: full-width 2 characters, half-width 4
                    if (ShiftJisLength(model.宛先敬称) > 4)
                    {
                        return Error(
                            "宛先敬称は全角２文字までです。！！", "宛先敬称");
                    }
                }

                //
                // 実車Km入力
                //
                if (!IsValidOption(model.実車区分))
                {
                    return Error(
                        "実車Ｋmが異常です！！", "実車区分");
                }

                //
                // 課税割増
                //
                if (!IsValidOption(model.課税割増))
                {
                    return Error(
                        "課税割増が異常です！！", "課税割増");
                }

                //
                // 非課税割増
                //
                if (!IsValidOption(model.非課税割増))
                {
                    return Error(
                        "非課税割増が異常です！！", "非課税割増");
                }

                //
                // 請求日設定
                //
                if (!IsValidThreeOption(model.請求日設定))
                {
                    return Error(
                        "請求日設定が異常です！！", "請求日設定");
                }

            //
            // シリアルNO1～10
            //

            var serials = new[]
            {
                model.シリアルNO1,
                model.シリアルNO2,
                model.シリアルNO3,
                model.シリアルNO4,
                model.シリアルNO5,
                model.シリアルNO6,
                model.シリアルNO7,
                model.シリアルNO8,
                model.シリアルNO9,
                model.シリアルNO10
            };

            for (var i = 0; i < serials.Length; i++)
            {
                if (!ValidateSerial(serials[i]))
                    {
                        return Error("シリアル№が異常です！！", $"シリアルNO{i + 1}");
                    }
                }

                //
                // カード優先
                //
                if (model.カード優先 == null)
                {
                    // legacy quirk: blank switches to シリアル設定 (SelectedIndex = 2), not to オプション設定
                    var blankCard = Error("カード優先を入力して下さい。", "カード優先");
                    blankCard.ErrorTab = "serialSetting";
                    return blankCard;
                }

                if (model.カード優先 != 0 && model.カード優先 != 1)
                {
                    return Error("カード優先を正しく入力して下さい。", "カード優先");
                }

                return null;
            }

            // field: the model property the screen puts the cursor on after the message
            private static ManagementMasterSaveResult Error(string message, string? field = null)
            {
                return new ManagementMasterSaveResult
                {
                    Success = false,
                    ErrorMessage = message,
                    ErrorField = field
                };
            }

            // legacy date boxes: MinDate 1 Jan of the first year, MaxDate 2050-12-31
            private static bool InRange(DateTime? date, int firstYear)
            {
                return date >= new DateTime(firstYear, 1, 1) && date <= new DateTime(2050, 12, 31, 23, 59, 59);
            }

            private static bool IsValidVoucher(int? value)
            {
                return value != null && value >= 0;
            }

            // 0・1・2 (Lbl_Color)
            private static bool IsValidThreeOption(int? value)
            {
                return value is >= 0 and <= 2;
            }

            // 0・1 (Lbl_Color)
            private static bool IsValidOption(int? value)
            {
                return value is 0 or 1;
            }

            // Bytes as legacy Separate_Chara counts them: ASCII and half-width kana 1, others 2
            private static int ShiftJisLength(string text)
            {
                return text.Sum(c => c <= 0x7F || (c >= 0xFF61 && c <= 0xFF9F) ? 1 : 2);
            }

            private static bool ValidateSerial(string? serial)
            {
                if (string.IsNullOrWhiteSpace(serial))
                {
                    return true;
                }

                long total = 0;

                foreach (var c in serial)
                {
                    total += c;
                }

                return total == 1000;
            }
        }
}