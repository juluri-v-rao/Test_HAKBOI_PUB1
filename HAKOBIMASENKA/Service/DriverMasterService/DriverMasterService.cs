using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel;
using HAKOBIMASENKA.Repository.DriverMasterRepository;

namespace HAKOBIMASENKA.Service.DriverMasterService
{
    /// <summary>
    /// 運転手マスタ rules (legacy FrmM_Tanto), all tabs including 運転者台帳 1-4.
    /// </summary>
    public class DriverMasterService : IDriverMasterService
    {
        private const int CodeLength = 10;

        // legacy Dsp_Post: Separate_Chara(住所, 32) splits the address at 32 bytes (Shift-JIS)
        private const int AddressBytes = 32;

        // legacy CmdPict_Click: CommonDialog1.Filter = "運転手画像(*.jpg,*.gif,*.bmp,*.jpeg)"
        private static readonly Dictionary<string, string> PhotoTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".gif"] = "image/gif",
            [".bmp"] = "image/bmp"
        };

        private readonly IDriverMasterRepository _repository;

        // 入力端末: this terminal's number (legacy E_CODE), as the other masters
        private readonly string _terminalCode;

        public DriverMasterService(IDriverMasterRepository repository, IConfiguration configuration)
        {
            _repository = repository;
            _terminalCode = configuration["Terminal:ClientNo"] ?? "01";
        }

        // =========================================
        //              Load / Codes
        // =========================================

        // Dsp_Data + INS_Kotei / Dsp_List + the 8 histories: the driver as the screen shows it.
        public async Task<DriverMasterViewModel?> GetByCodeAsync(string code)
        {
            code = PadCode(code, CodeLength);

            var model = await _repository.GetByCodeAsync(code);

            if (model == null)
            {
                return null;
            }

            model.固定経費 = await _repository.GetFixedExpensesAsync(code);
            await _repository.LoadHistoriesAsync(model);

            // legacy Dsp_Data: 写真パス is shown only when the file is there (If Dir(写真パス) <> "");
            // otherwise the box stays empty, and F1 then writes 写真パス = ''.
            if (FindPhotoFile(model.写真パス) == null)
            {
                model.写真パス = "";
            }

            return model;
        }

        public Task<bool> ExistsAsync(string code)
        {
            return _repository.ExistsAsync(PadCode(code, CodeLength));
        }

        // legacy Set_Code: the highest code + 1; blank once 10 digits are used up
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
        //              Screen setup
        // =========================================

        public Task<IEnumerable<DriverMasterOptionDto>> GetVehiclesAsync()
        {
            return _repository.GetVehiclesAsync();
        }

        public Task<IEnumerable<DriverMasterOptionDto>> GetCharteredAsync()
        {
            return _repository.GetCharteredAsync();
        }

        public Task<DriverMasterLicenseDto> GetLicenseAsync()
        {
            return _repository.GetLicenseAsync();
        }

        // =========================================
        //              Lookups
        // =========================================

        public Task<string?> FindVehicleNumberAsync(string code)
        {
            return _repository.FindVehicleNumberAsync(PadCode(code, CodeLength));
        }

        public Task<string?> FindCharteredNameAsync(string code)
        {
            return _repository.FindCharteredNameAsync(PadCode(code, CodeLength));
        }

        // legacy TxtBKbn_LostFocus: ZeroPad(2)
        public Task<string?> FindDepartmentNameAsync(string code)
        {
            return _repository.FindDepartmentNameAsync(PadCode(code, 2));
        }

        // legacy TxtSKbn_LostFocus: ZeroPad(3)
        public Task<string?> FindAffiliationNameAsync(string code)
        {
            return _repository.FindAffiliationNameAsync(PadCode(code, 3));
        }

        // legacy TxtKeihi_LostFocus: ZeroPad(4)
        public Task<string?> FindExpenseNameAsync(string code)
        {
            return _repository.FindExpenseNameAsync(PadCode(code, 4));
        }

        // legacy Dsp_Post: 郵便番号マスタ holds the code without the hyphen; the address is split at 32 bytes.
        public async Task<(string Address1, string Address2)?> FindAddressAsync(string postalCode)
        {
            var address = await _repository.FindAddressAsync((postalCode ?? "").Replace("-", "").Trim());

            if (address == null)
            {
                return null;
            }

            var first = LeftBytes(address, AddressBytes);
            var second = LeftBytes(address.Substring(first.Length), AddressBytes);

            return (first.Trim(), second.Trim());
        }

        // legacy Dsp_Image: ImgPict.ImageLocation = 写真パス when the file is there.
        // Only the picture types of the legacy file dialog are served.
        public (string Path, string ContentType)? FindPhotoFile(string? path)
        {
            var file = (path ?? "").Trim();

            if (file == "" || !PhotoTypes.TryGetValue(Path.GetExtension(file), out var contentType))
            {
                return null;
            }

            try
            {
                return File.Exists(file) ? (file, contentType) : null;
            }
            catch
            {
                return null;
            }
        }

        // =========================================
        //          Save (Input_Chk + Data_Repl)
        // =========================================

        public async Task<(string? Message, string? Field)> SaveAsync(DriverMasterViewModel model)
        {
            Normalize(model);

            var error = Check(model);
            if (error.Message != null)
            {
                return error;
            }

            // legacy: If TxtFile.Text <> "" Then 運転手写真 = OPENROWSET(BULK 写真パス)
            byte[]? photo = null;

            if (model.写真パス != "")
            {
                try
                {
                    photo = await File.ReadAllBytesAsync(model.写真パス!);
                }
                catch
                {
                    return ($"写真ファイル『{model.写真パス}』を読み込めませんでした。", "写真パス");
                }
            }

            await _repository.SaveAsync(model, _terminalCode, photo);

            return (null, null);
        }

        // Same checks and messages as legacy Input_Chk, in the same order.
        // The screen runs them first; these stop a request that skipped the screen.
        private static (string? Message, string? Field) Check(DriverMasterViewModel m)
        {
            if (m.運転手コード == "")
            {
                return ("運転手ｺｰﾄﾞを入力してください", "運転手コード");
            }

            if (m.運転手コード == "0000000000")
            {
                return ("運転手コード：0000000000 は手入力用コードなのでマスタ登録はできません", "運転手コード");
            }

            if (m.運転手名 == "")
            {
                return ("運転手名を入力してください", "運転手名");
            }

            if (m.ふりがな == "")
            {
                return ("フリガナを入力してください", "ふりがな");
            }

            if (m.運転手区分 == "")
            {
                return ("運転手区分を入力して下さい。", "運転手区分");
            }

            if (m.運転手区分 is not ("0" or "1" or "2"))
            {
                return ("運転手区分を正しく入力して下さい。", "運転手区分");
            }

            if (m.運転手区分 is ("1" or "2") && m.傭車コード == "")
            {
                return ("傭車を入力してください", "傭車コード");
            }

            if (m.雇用区分 == "")
            {
                return ("雇用区分を入力して下さい。", "雇用区分");
            }

            if (m.雇用区分 is not ("0" or "1" or "2" or "3" or "4" or "5" or "6"))
            {
                return ("雇用区分を正しく入力して下さい。", "雇用区分");
            }

            if (m.性別 == "")
            {
                return ("性別を入力して下さい。", "性別");
            }

            if (m.性別 is not ("1" or "2"))
            {
                return ("性別を正しく入力して下さい。", "性別");
            }

            return (null, null);
        }

        // Legacy writes '' (never NULL) for empty text, pads the codes, '0' / '1' for the check boxes
        // and 0 for empty numbers.
        private static void Normalize(DriverMasterViewModel m)
        {
            m.運転手コード = PadCode(m.運転手コード, CodeLength);
            m.運転手名 ??= "";
            m.ふりがな ??= "";
            m.郵便 ??= "";
            m.住所1 ??= "";
            m.住所2 ??= "";
            m.電話番号 ??= "";
            m.携帯番号 ??= "";
            m.運転手区分 = (m.運転手区分 ?? "").Trim();
            m.車輌コード = PadCode(m.車輌コード, CodeLength);

            // legacy Lbl_Color("運転手区分"): 0 (自社) empties and locks the 傭車
            m.傭車コード = m.運転手区分 == "0" ? "" : PadCode(m.傭車コード, CodeLength);

            m.部門コード = PadCode(m.部門コード, 2);
            m.備考 ??= "";
            m.配車表示 = Flag(m.配車表示);
            m.手当掛率 ??= 0;
            m.所属コード = PadCode(m.所属コード, 3);
            m.雇用区分 = (m.雇用区分 ?? "").Trim();
            m.所定労働 ??= 0;
            m.デジタココード ??= "";
            m.ETCカード ??= "";

            foreach (var row in m.固定経費 ?? [])
            {
                row.経費コード = PadCode(row.経費コード, 4);
                row.車輌コード = PadCode(row.車輌コード, CodeLength);
                row.分割方法 = row.分割方法 == "1" ? "1" : "0";

                // legacy Lbl_Color("計上方法"): 毎月 empties the months, 月指定 empties 毎月
                if (row.分割方法 == "0")
                {
                    row.金額1 = row.金額2 = row.金額3 = row.金額4 = row.金額5 = row.金額6 = null;
                    row.金額7 = row.金額8 = row.金額9 = row.金額10 = row.金額11 = row.金額12 = null;
                }
                else
                {
                    row.金額 = null;
                }
            }

            // ---- 運転者台帳1 ----
            m.性別 = (m.性別 ?? "").Trim();
            m.写真パス = (m.写真パス ?? "").Trim();
            m.免許証番号 ??= "";
            m.条件 ??= "";

            m.大型 = Flag(m.大型);
            m.普通 = Flag(m.普通);
            m.大特 = Flag(m.大特);
            m.けん引 = Flag(m.けん引);
            m.大2 = Flag(m.大2);
            m.普2 = Flag(m.普2);
            m.大特2 = Flag(m.大特2);
            m.けん引2 = Flag(m.けん引2);
            m.中型 = Flag(m.中型);
            m.中型限定 = Flag(m.中型限定);
            m.準中型 = Flag(m.準中型);
            m.準中型限定 = Flag(m.準中型限定);
            m.中2 = Flag(m.中2);
            m.中2限定 = Flag(m.中2限定);
            m.ユニック = Flag(m.ユニック);
            m.玉掛け = Flag(m.玉掛け);
            m.フォーク = Flag(m.フォーク);

            m.職歴1 ??= "";
            m.職歴2 ??= "";
            m.職歴3 ??= "";
            m.職歴4 ??= "";
            m.職歴5 ??= "";

            m.自動車種類1 ??= "";
            m.自動車種類2 ??= "";

            // legacy writes the typed text into money columns: '' becomes 0
            m.定員数1 ??= 0;
            m.定員数2 ??= 0;
            m.経験年数1 ??= 0;
            m.経験年数2 ??= 0;
            m.経験月数1 ??= 0;
            m.経験月数2 ??= 0;

            // legacy: CLng(TxtCapa.Value) when numeric, else 0
            m.積載量1 = WholeNumber(m.積載量1);
            m.積載量2 = WholeNumber(m.積載量2);

            m.経験事業所名1 ??= "";
            m.経験事業所名2 ??= "";

            // ---- 運転者台帳4 ----
            m.健保番号 ??= "";
            m.厚保番号 ??= "";
            m.雇保番号 ??= "";
            m.労災番号 ??= "";

            m.徒歩 = Flag(m.徒歩);
            m.自動車 = Flag(m.自動車);
            m.バス = Flag(m.バス);
            m.電車 = Flag(m.電車);
            m.自転車 = Flag(m.自転車);
            m.その他 = Flag(m.その他);
            m.通勤方法その他 ??= "";

            // legacy: CLng(TxtTKh / TxtTKm) when numeric, else 0
            m.通勤h = WholeNumber(m.通勤h);
            m.通勤m = WholeNumber(m.通勤m);

            m.緊急連絡先 ??= "";
            m.緊急連絡先番号 ??= "";
            m.退社理由1 ??= "";
            m.退社理由2 ??= "";
            m.台帳備考1 ??= "";
            m.台帳備考2 ??= "";
            m.台帳備考3 ??= "";
            m.台帳備考4 ??= "";
            m.台帳備考5 ??= "";
            m.台帳備考6 ??= "";
            m.台帳備考7 ??= "";
            m.台帳備考8 ??= "";

            // The history rows are saved as the screen holds them (legacy copies its wk tables as they are).
        }

        private static string Flag(string? value)
        {
            return (value ?? "").Trim() == "1" ? "1" : "0";
        }

        // VB CLng: rounds half to even
        private static decimal WholeNumber(decimal? value)
        {
            return value == null ? 0 : Math.Round(value.Value, 0, MidpointRounding.ToEven);
        }

        // =========================================
        //          Delete (Del_Chk + Data_Del)
        // =========================================

        public async Task<string?> CheckDeleteAsync(string code)
        {
            // legacy Del_Chk: 車輌マスタ is checked only when 管理マスタ 発着地区分 (NINPUT_Chk) = 0
            var checkVehicle = await _repository.GetArrivalDepartureTypeAsync() is "" or "0";

            return await _repository.GetDeleteBlockReasonAsync(PadCode(code, CodeLength), checkVehicle);
        }

        public async Task<string?> DeleteAsync(string code)
        {
            code = PadCode(code, CodeLength);

            var reason = await CheckDeleteAsync(code);
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

        // The leading characters that fit in maxBytes, counted as Shift-JIS
        // (half-width ASCII and half-width kana 1 byte, everything else 2).
        private static string LeftBytes(string text, int maxBytes)
        {
            var bytes = 0;
            var length = 0;

            foreach (var ch in text)
            {
                var size = ch <= '~' || (ch >= '｡' && ch <= 'ﾟ') ? 1 : 2;

                if (bytes + size > maxBytes)
                {
                    break;
                }

                bytes += size;
                length++;
            }

            return text.Substring(0, length);
        }
    }
}
