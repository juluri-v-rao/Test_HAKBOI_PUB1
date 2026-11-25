using Dapper;
using HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel;
using System.Data;

namespace HAKOBIMASENKA.Repository.OrderEntryRepository
{
    public class OrderEntryRepository(IDbConnectionFactory connectionFactory, IConfiguration configuration) : IOrderEntryRepository
    {

        private readonly IDbConnectionFactory _connectionFactory = connectionFactory;

        // 入力端末: this terminal's number (legacy E_CODE), used in 受注NO, 作業NO and 入力端末
        private readonly string InputTerminal = configuration["Terminal:ClientNo"] ?? "01";

        private const long MaxVoucherNo = 99999999;

        public async Task<OrderEntryDto?> GetByOrderNoAsync(string orderNo)
        {
            // Query 作業明細
            const string sql = @"
            SELECT *
            FROM 作業明細
            WHERE 受注NO = @OrderNo
            ORDER BY 受注行NO";

            using var conn = _connectionFactory.CreateConnection();

            var rows = (await conn.QueryAsync(sql,
            new { OrderNo = orderNo }))
            .ToList();

                if (rows.Count == 0)
                {
                    return null;
                }

                var firstRow = rows[0];

                var dto = new OrderEntryDto
                {
                    OrderNo = firstRow.受注NO ?? "",
                    OrderDate = firstRow.受注日,

                    BranchCode = firstRow.部門コード ?? "",
                    BranchName = firstRow.部門名 ?? "",

                    WorkVoucherNo = firstRow.作業NO ?? ""
                };

                dto.Details = rows
                .Select(x => new OrderDetailDto
                {
                    RowNo = x.受注行NO == null
                        ? 0
                        : Convert.ToInt32(x.受注行NO),

                    WorkVoucherNo = x.作業NO ?? "",

                    SupplierCode = x.荷主コード ?? "",
                    SupplierName = x.荷主名 ?? "",

                    LoadingDate = x.積日,
                    LoadingNotes = x.積時間 ?? "",

                    UnloadingDate = x.卸日,
                    UnloadingNotes = x.卸時間 ?? "",

                    DriverCode = x.運転手コード ?? "",
                    DriverName = x.運転手名 ?? "",
                    DriverContact = x.運転手電話番号 ?? "",

                    // 発地
                    DepartureCode = x.発地コード ?? "",
                    DepartureName = x.発地名 ?? "",
                    DepartureAddress = x.発着住所 ?? "",

                    // 発地担当
                    DepartureAdminName = x.発地担当者 ?? "",
                    DepartureAdminPhone = x.発着電話番号 ?? "",

                    // 着地
                    ArrivalCode = x.着地コード ?? "",
                    ArrivalName = x.着地名 ?? "",
                    ArrivalAddress = x.着地住所 ?? "",

                    // 着地担当
                    ArrivalAdminName = x.着地担当者 ?? "",
                    ArrivalAdminPhone = x.着地電話番号 ?? "",

                    // 品名
                    ProductCode = x.品名コード ?? "",
                    ProductName = x.品名 ?? "",
                    ProductType = x.荷姿 ?? "",

                    // 数量
                    Quantity = x.数量 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.数量),

                    Weight = x.重量 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.重量),

                    BillingUnitCode = x.単位コード ?? "",
                    BillingUnitName = x.単位名 ?? "",

                    BillingUnitPrice = x.単価 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.単価),

                    FreightCharge = x.請求運賃 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.請求運賃),

                    Surcharge = x.割増 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.割増),

                    TollCharge = x.有料請求 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.有料請求),

                    PaymentUnitCode = x.下払単位コード ?? "",
                    PaymentUnitName = x.下払単位名 ?? "",

                    PaymentUnitPrice = x.下払単価 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.下払単価),

                    FreightPay = x.支払運賃 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.支払運賃),

                    SurchargePay = x.下払割増 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.下払割増),

                    TollPay = x.有料支払 == null
                    ? null
                    : (decimal?)Convert.ToDecimal(x.有料支払),

                    VehicleCode = x.車輌コード ?? "",
                    VehicleNumber = x.車番 ?? "",

                    VehicleTypeCode = x.車種区分 ?? "",
                    VehicleTypeName = x.車種名 ?? "",

                    CharteredVehicleCode = x.傭車コード ?? "",
                    CharteredVehicleName = x.傭車名 ?? "",

                    SubcontractedVehicleName = x.孫請傭車名 ?? "",

                    ActualOperation = x.実運 ?? "",

                    ReportNotes = x.備考 ?? "",
                    InternalNotes = x.社内備考 ?? "",

                    DailyReportNo = x.日報NO ?? "",

                    DailyReportRowNo = x.日報行NO == null
                    ? null
                    : (int?)Convert.ToInt32(x.日報行NO),

                    }).ToList();

             return dto;
        }

        public async Task<OrderEntryDto?> GetNextOrderAsync(string orderNo)
        {
            using var conn = _connectionFactory.CreateConnection();

            const string sql = @"
            SELECT TOP 1
            受注NO
            FROM 作業明細 WITH(NOLOCK)
            WHERE 受注NO > @OrderNo
            ORDER BY 受注NO";

            var nextOrderNo = await conn.QueryFirstOrDefaultAsync<string>(sql,
                                new
                                {
                                    OrderNo = orderNo
                                });

            if (string.IsNullOrEmpty(nextOrderNo))
            {
                return null;
            }

            return await GetByOrderNoAsync(nextOrderNo);
        }

        public async Task<OrderEntryDto?> GetPreviousOrderAsync(string orderNo)
        {
            using var conn = _connectionFactory.CreateConnection();

            const string sql = @"
            SELECT TOP 1
            受注NO
            FROM 作業明細 WITH(NOLOCK)
            WHERE 受注NO < @OrderNo
            ORDER BY 受注NO DESC";

            var previousOrderNo = await conn.QueryFirstOrDefaultAsync<string>(sql,
                    new
                    {
                        OrderNo = orderNo
                    });

            if (string.IsNullOrEmpty(previousOrderNo))
            {
                return null;
            }

            return await GetByOrderNoAsync(previousOrderNo);
        }

        // Migrated from Data_Repl, Dno_Up and Dno_UpS (FrmN_Juchu.vb).
        public async Task SaveAsync(OrderEntryDto dto)
        {
            using var conn = _connectionFactory.CreateConnection();

            if (conn.State != ConnectionState.Open)
            {
                conn.Open();
            }

            // Disposing without a commit rolls everything back.
            using var transaction = conn.BeginTransaction();

            // Holding this lock until commit stops concurrent saves
            // from allocating the same 作業NO.
            const string counterSql = @"
            SELECT 伝票番号9
            FROM 管理マスタ WITH(UPDLOCK, ROWLOCK)
            WHERE 自社コード = '01'";

            var counter = await conn.QueryFirstOrDefaultAsync(counterSql, transaction: transaction)
                ?? throw new InvalidOperationException("管理ファイルに異常発生！！");

            long lastWorkNo = counter.伝票番号9 == null
                ? 0L
                : Convert.ToInt64(counter.伝票番号9);

            if (lastWorkNo == MaxVoucherNo)
            {
                lastWorkNo = 0;
            }

            const string existingRowsSql = @"
            SELECT 受注行NO
            FROM 作業明細
            WHERE 受注NO = @OrderNo
            AND 受注行NO IS NOT NULL";

            var existingRowNos = (await conn.QueryAsync<int>(
                existingRowsSql,
                new { dto.OrderNo },
                transaction)).ToHashSet();

            // As legacy Data_Repl: a 受注NO already in 作業明細 (even on 新規) has its missing rows
            // inserted and its existing rows updated; there is no "already registered" check.

            // A row with a 荷主コード is saved; any other row is removed.
            var activeRows = dto.Details
                .Where(x => !string.IsNullOrEmpty(x.SupplierCode))
                .ToList();

            var removedRowNos = existingRowNos
                .Except(activeRows.Select(x => x.RowNo))
                .ToList();

            if (removedRowNos.Count > 0)
            {
                const string deleteRowsSql = @"
                DELETE FROM 作業明細
                WHERE 受注NO = @OrderNo
                AND 受注行NO IN @RowNos";

                await conn.ExecuteAsync(
                    deleteRowsSql,
                    new { dto.OrderNo, RowNos = removedRowNos },
                    transaction);
            }

            var newRows = activeRows
                .Where(x => !existingRowNos.Contains(x.RowNo))
                .ToList();

            if (newRows.Count > 0)
            {
                const string insertSql = @"
                INSERT INTO 作業明細(
                 作業NO
                ,受注NO
                ,受注行NO
                ,輸送印刷
                ,作業印刷
                ,配車印刷
                )
                VALUES(
                 @WorkNo
                ,@OrderNo
                ,@RowNo
                ,'0'
                ,'0'
                ,'0'
                )";

                var insertRows = new List<object>();

                foreach (var row in newRows)
                {
                    lastWorkNo++;

                    insertRows.Add(new
                    {
                        WorkNo = lastWorkNo.ToString("D8") + InputTerminal,
                        dto.OrderNo,
                        row.RowNo
                    });
                }

                await conn.ExecuteAsync(insertSql, insertRows, transaction);
            }

            if (activeRows.Count > 0)
            {
                const string updateSql = @"
                UPDATE 作業明細 SET
                 受注日 = @OrderDate
                ,部門コード = @BranchCode
                ,部門名 = @BranchName
                ,荷主コード = @SupplierCode
                ,荷主名 = @SupplierName
                ,積日 = @LoadingDate
                ,積時間 = @LoadingNotes
                ,卸日 = @UnloadingDate
                ,卸時間 = @UnloadingNotes
                ,発地コード = @DepartureCode
                ,発地名 = @DepartureName
                ,発着住所 = @DepartureAddress
                ,着地コード = @ArrivalCode
                ,着地名 = @ArrivalName
                ,着地住所 = @ArrivalAddress
                ,発地担当者 = @DepartureAdminName
                ,発着電話番号 = @DepartureAdminPhone
                ,着地担当者 = @ArrivalAdminName
                ,着地電話番号 = @ArrivalAdminPhone
                ,数量 = @Quantity
                ,重量 = @Weight
                ,単位コード = @BillingUnitCode
                ,単位名 = @BillingUnitName
                ,単価 = @BillingUnitPrice
                ,請求運賃 = @FreightCharge
                ,割増 = @Surcharge
                ,有料請求 = @TollCharge
                ,下払単位コード = @PaymentUnitCode
                ,下払単位名 = @PaymentUnitName
                ,下払単価 = @PaymentUnitPrice
                ,支払運賃 = @FreightPay
                ,下払割増 = @SurchargePay
                ,有料支払 = @TollPay
                ,車輌コード = @VehicleCode
                ,車番 = @VehicleNumber
                ,車種区分 = @VehicleTypeCode
                ,車種名 = @VehicleTypeName
                ,品名コード = @ProductCode
                ,品名 = @ProductName
                ,荷姿 = @ProductType
                ,傭車コード = @CharteredVehicleCode
                ,傭車名 = @CharteredVehicleName
                ,孫請傭車名 = @SubcontractedVehicleName
                ,運転手コード = @DriverCode
                ,運転手名 = @DriverName
                ,運転手電話番号 = @DriverContact
                ,備考 = @ReportNotes
                ,社内備考 = @InternalNotes
                ,登録日 = GETDATE()
                ,送信済 = '1'
                ,入力端末 = @InputTerminal
                ,削除 = '0'
                ,日報NO = @DailyReportNo
                ,日報行NO = @DailyReportRowNo
                WHERE 受注NO = @OrderNo
                AND 受注行NO = @RowNo";

                var updateRows = activeRows.Select(x => new
                {
                    dto.OrderNo,
                    x.RowNo,
                    dto.OrderDate,
                    BranchCode = dto.BranchCode ?? "",
                    BranchName = dto.BranchName ?? "",
                    x.SupplierCode,
                    SupplierName = x.SupplierName ?? "",
                    x.LoadingDate,
                    LoadingNotes = x.LoadingNotes ?? "",
                    x.UnloadingDate,
                    UnloadingNotes = x.UnloadingNotes ?? "",
                    DepartureCode = x.DepartureCode ?? "",
                    DepartureName = x.DepartureName ?? "",
                    DepartureAddress = x.DepartureAddress ?? "",
                    ArrivalCode = x.ArrivalCode ?? "",
                    ArrivalName = x.ArrivalName ?? "",
                    ArrivalAddress = x.ArrivalAddress ?? "",
                    DepartureAdminName = x.DepartureAdminName ?? "",
                    DepartureAdminPhone = x.DepartureAdminPhone ?? "",
                    ArrivalAdminName = x.ArrivalAdminName ?? "",
                    ArrivalAdminPhone = x.ArrivalAdminPhone ?? "",
                    Quantity = x.Quantity ?? 0m,
                    Weight = x.Weight ?? 0m,
                    BillingUnitCode = x.BillingUnitCode ?? "",
                    BillingUnitName = x.BillingUnitName ?? "",
                    BillingUnitPrice = x.BillingUnitPrice ?? 0m,
                    FreightCharge = x.FreightCharge ?? 0m,
                    Surcharge = x.Surcharge ?? 0m,
                    TollCharge = x.TollCharge ?? 0m,
                    PaymentUnitCode = x.PaymentUnitCode ?? "",
                    PaymentUnitName = x.PaymentUnitName ?? "",
                    PaymentUnitPrice = x.PaymentUnitPrice ?? 0m,
                    FreightPay = x.FreightPay ?? 0m,
                    SurchargePay = x.SurchargePay ?? 0m,
                    TollPay = x.TollPay ?? 0m,
                    VehicleCode = x.VehicleCode ?? "",
                    VehicleNumber = x.VehicleNumber ?? "",
                    VehicleTypeCode = x.VehicleTypeCode ?? "",
                    VehicleTypeName = x.VehicleTypeName ?? "",
                    ProductCode = x.ProductCode ?? "",
                    ProductName = x.ProductName ?? "",
                    ProductType = x.ProductType ?? "",
                    CharteredVehicleCode = x.CharteredVehicleCode ?? "",
                    CharteredVehicleName = x.CharteredVehicleName ?? "",
                    SubcontractedVehicleName = x.SubcontractedVehicleName ?? "",
                    DriverCode = x.DriverCode ?? "",
                    DriverName = x.DriverName ?? "",
                    DriverContact = x.DriverContact ?? "",
                    ReportNotes = x.ReportNotes ?? "",
                    InternalNotes = x.InternalNotes ?? "",
                    InputTerminal,
                    DailyReportNo = x.DailyReportNo ?? "",
                    DailyReportRowNo = x.DailyReportRowNo ?? 0
                });

                await conn.ExecuteAsync(updateSql, updateRows, transaction);
            }

            if (newRows.Count > 0)
            {
                const string updateWorkNoSql = @"
                UPDATE 管理マスタ
                SET 伝票番号9 = @LastWorkNo
                WHERE 自社コード = '01'";

                await conn.ExecuteAsync(
                    updateWorkNoSql,
                    new { LastWorkNo = lastWorkNo },
                    transaction);
            }

            // 受注NO is an 8-digit sequence followed by a 2-digit terminal code.
            if (dto.IsNew
                && long.TryParse(dto.OrderNo?[..Math.Min(8, dto.OrderNo.Length)], out var orderSequence))
            {
                const string updateOrderNoSql = @"
                UPDATE 管理マスタ
                SET 伝票番号1 = @OrderSequence
                WHERE 自社コード = '01'
                AND 伝票番号1 < @OrderSequence";

                await conn.ExecuteAsync(
                    updateOrderNoSql,
                    new { OrderSequence = orderSequence },
                    transaction);
            }

            transaction.Commit();
        }

        // Migrated from Data_Del (FrmN_Juchu.vb).
        public async Task DeleteAsync(string orderNo)
        {
            const string sql = @"
            DELETE FROM 作業明細
            WHERE 受注NO = @OrderNo";

            using var conn = _connectionFactory.CreateConnection();

            await conn.ExecuteAsync(sql, new { OrderNo = orderNo });
        }

        public async Task<string> GetNewOrderNoAsync()
        {
            const string sql = @"
            SELECT 伝票番号1
            FROM 管理マスタ
            WHERE 自社コード = '01'";

            using var conn = _connectionFactory.CreateConnection();

            var currentOrderNo = await conn.QueryFirstOrDefaultAsync<int>(sql);

            // Legacy Dno_Def: 伝票番号1 + 1, and 99999999 wraps to 1. Numbers in use are not skipped.
            var newNo = currentOrderNo == MaxVoucherNo ? 1 : currentOrderNo + 1;

            // 8-digit sequence + 2-digit terminal code
            return newNo.ToString("D8") + InputTerminal;
        }

        public async Task<string> GetNewWorkVoucherNoAsync()
        {
            const string sql = @"
            SELECT 伝票番号9
            FROM 管理マスタ
            WHERE 自社コード = '01'";

            using var conn = _connectionFactory.CreateConnection();

            // 伝票番号9 is money, so read it as a number: "26", not "26.0000".
            // Legacy Dno_Def: empty or 99999999 → 0.
            var lastWorkNo = await conn.QueryFirstOrDefaultAsync<decimal?>(sql);

            var workVoucherNo = lastWorkNo == null || lastWorkNo == MaxVoucherNo
                ? 0
                : (long)lastWorkNo.Value;

            return workVoucherNo.ToString();
        }

        public async Task<(string BranchCode, string BranchName)> GetDefaultBranchAsync()
        {
            const string sql = @"
            SELECT
             自社コード
            ,略称
            FROM 管理マスタ WITH(NOLOCK)
            WHERE 自社コード = '01'";

            using var conn = _connectionFactory.CreateConnection();

            //var branch = await conn.QueryFirstOrDefaultAsync<(string BranchCode, string BranchName)>(sql);
            var branch = await conn.QueryFirstOrDefaultAsync(sql);

            if (branch == null)
            {
                return ("", "");
            }

            return (
                branch.自社コード ?? "",
                branch.略称 ?? ""
            );
        }
    }
}
