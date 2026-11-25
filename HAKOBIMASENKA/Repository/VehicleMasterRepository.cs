using Dapper;
using HAKOBIMASENKA.ViewModels;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace HAKOBIMASENKA.Repository
{
    public class VehicleMasterRepository : IVehicleMasterRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly string _clientNo;

        public VehicleMasterRepository(
            IDbConnectionFactory connectionFactory,
            IConfiguration configuration)
        {
            _connectionFactory = connectionFactory;
            _clientNo = configuration["Terminal:ClientNo"] ?? "01";
        }
        public async Task<VehicleMasterResultDto?> GetDepartmentByCodeAsync(
            string code)
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT");
            sql.AppendLine("    [コード] AS DepartmentCode,");
            sql.AppendLine("    [名称] AS DepartmentName");
            sql.AppendLine("FROM [部門マスタ] WITH (NOLOCK)");
            sql.AppendLine("WHERE [コード] = @Code");

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<VehicleMasterResultDto>(
                sql.ToString(),
                new { Code = code });
        }

        // Retrieve Expense Master details by expense code.
        public async Task<VehicleMasterResultDto?> GetExpenseByCodeAsync(
            string code)
        {

            var sql = new StringBuilder();

            sql.AppendLine("SELECT");
            sql.AppendLine("    [経費コード] AS ExpenseCode,");
            sql.AppendLine("    [名称] AS ExpenseName");
            sql.AppendLine("FROM [経費マスタ] WITH (NOLOCK)");
            sql.AppendLine("WHERE [経費コード] = @Code");

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<VehicleMasterResultDto>(
               sql.ToString(),
                new { Code = code });
        }
        // Driver Master.
        public async Task<VehicleMasterResultDto?> GetDriverByCodeAsync(
            string code,
            bool sinkFlg)
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT");
            sql.AppendLine("    [運転手コード] AS DriverCode,");
            sql.AppendLine("    [運転手名] AS DriverName");
            sql.AppendLine("FROM [運転手マスタ] WITH (NOLOCK)");
            sql.AppendLine("WHERE [運転手コード] = @Code");

            // When Sink_Flg is true, exclude drivers who have left.
            if (sinkFlg)
            {
                sql.AppendLine("  AND [退社日] IS NULL");
            }

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<VehicleMasterResultDto>(
                sql.ToString(),
                new { Code = code });
        }
        // Retrieve all expense categories ordered by category code.
        public async Task<IEnumerable<VehicleMasterResultDto>>
            GetExpenseCategoriesAsync()
        {
            const string sql = @"
                SELECT
                    [コード] AS ExpenseCategoryCode,
                    [名称] AS ExpenseCategoryName
                FROM 経費区分マスタ WITH (NOLOCK)
                ORDER BY [コード];
            ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryAsync<VehicleMasterResultDto>(sql);
        }

        // Get transport types from Transport Type Master
        public async Task<IEnumerable<VehicleMasterResultDto>> GetTransportTypesAsync()
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT");
            sql.AppendLine(" [コード] AS TransportTypeCode");
            sql.AppendLine(",[名称] AS TransportTypeName");
            sql.AppendLine("FROM 運賃形態マスタ WITH(NOLOCK)");
            sql.AppendLine("ORDER BY [コード]");
            sql.AppendLine(";");

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryAsync<VehicleMasterResultDto>(
                sql.ToString()
            );
        }

        public async Task<VehicleMasterResultDto?> GetVehicleByCodeAsync(
      string code)
        {
            const string sql = @"
        SELECT
    V.車輌コード AS VehicleCode,
    V.車番 AS VehicleCarNumber,
    V.メーカー名 AS VehicleMakerName,
    V.形式 AS VehicleModel,
    V.車台番号 AS VehicleChassisNumber,
    V.エンジン AS VehicleEngine,
    V.初年度 AS VehicleFirstYear,
    V.登録年月日 AS VehicleRegistrationDate,
    V.車検日 AS VehicleInspectionDate,
    V.総走行Km AS VehicleTotalDistanceKm,
    V.最大積載重量 AS VehicleMaximumLoadCapacity,
    V.運賃形態 AS VehicleTransportTypeCode,
    F.名称 AS VehicleTransportTypeName,
    V.納車日 AS VehicleDeliveryDate,
    V.廃車日 AS VehicleDeregistrationDate,
    V.車輌区分 AS VehicleTypeCode,
    V.運転手コード AS VehicleDriverCode,
    D1.運転手名 AS VehicleDriverName1,
    D2.運転手コード AS VehicleDriverCode2,
    D2.運転手名 AS VehicleDriverName2,
    V.部門コード AS VehicleDepartmentCode,
    B.名称 AS VehicleDepartmentName,
    V.手当掛率 AS VehicleAllowanceRate,
    V.配車表示 AS VehicleDispatchDisplay,
    V.デジタココード AS VehicleDigitalTachographCode,
    V.ETCカード AS VehicleEtcCard,
    V.業務区分 AS VehicleBusinessCategory,
    V.車種区分 AS VehicleCategory,
    V.O基準Km AS VehicleOilCriteriaKm,
    V.O交換日 AS VehicleOilExchangeDate,
    V.O交換Km AS VehicleOilExchangeKm
        FROM 車輌マスタ V WITH(NOLOCK)
        LEFT JOIN 運賃形態マスタ F WITH(NOLOCK)
            ON V.運賃形態 = F.コード
        LEFT JOIN 運転手マスタ D1 WITH(NOLOCK)
            ON V.運転手コード = D1.運転手コード
        LEFT JOIN 運転手マスタ D2 WITH(NOLOCK)
            ON V.車輌コード = D2.車輌コード
        LEFT JOIN 部門マスタ B WITH(NOLOCK)
            ON V.部門コード = B.コード
        WHERE V.車輌コード = @Code;
    ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<VehicleMasterResultDto>(
                sql,
                new { Code = code }
            );
        }

        // Retrieve tire maintenance records by vehicle code.
        public async Task<IEnumerable<VehicleMasterResultDto>> GetVehicleTiresByCodeAsync(
            string code)
        {
            const string sql = @"
       SELECT
    車輌コード AS VehicleTireVehicleCode,
    位置コード AS VehicleTirePositionCode,
    T基準Km AS VehicleTireCriteriaKm,
    T交換日 AS VehicleTireExchangeDate,
    T交換Km AS VehicleTireExchangeKm,
    登録日 AS VehicleTireRegistrationDate
FROM 車輌タイヤマスタ WITH(NOLOCK)
WHERE 車輌コード = @Code
ORDER BY 位置コード;
    ";

            using var connection = _connectionFactory.CreateConnection();

            var result = await connection.QueryAsync<VehicleMasterResultDto>(
                sql,
                new { Code = code }
            );

            return result;
        }

        // Retrieve fixed expense records for a vehicle.
        public async Task<IEnumerable<VehicleMasterResultDto>> GetVehicleFixedExpensesAsync(
            string code)
        {
            const string sql = @"
       SELECT
            FE.[キー] AS VehicleFixedExpenseKey,
            FE.[車輌コード] AS VehicleFixedExpenseVehicleCode,
            FE.[経費コード] AS VehicleFixedExpenseCode,
            E.[名称] AS VehicleFixedExpenseName,
            FE.[運転手コード] AS VehicleFixedExpenseDriverCode,
            D.[運転手名] AS VehicleFixedExpenseDriverName,

            -- Convert the split method to its display text.
            CASE
                WHEN FE.[分割方法] = 1 THEN '1:月指定'
                WHEN FE.[分割方法] = 0 THEN '0:毎月'
                ELSE ''
            END AS VehicleFixedExpenseSplitMethod,

            -- Calculate the expense amount based on the split method.
            CASE
                WHEN FE.[分割方法] = 1 THEN
                    COALESCE(FE.[金額1], 0) +
                    COALESCE(FE.[金額2], 0) +
                    COALESCE(FE.[金額3], 0) +
                    COALESCE(FE.[金額4], 0) +
                    COALESCE(FE.[金額5], 0) +
                    COALESCE(FE.[金額6], 0) +
                    COALESCE(FE.[金額7], 0) +
                    COALESCE(FE.[金額8], 0) +
                    COALESCE(FE.[金額9], 0) +
                    COALESCE(FE.[金額10], 0) +
                    COALESCE(FE.[金額11], 0) +
                    COALESCE(FE.[金額12], 0)

                WHEN FE.[分割方法] = 0 THEN
                    COALESCE(FE.[金額], 0)

                ELSE 0
            END AS VehicleFixedExpenseAmount,

            FE.[金額1] AS VehicleFixedExpenseAmount1,
            FE.[金額2] AS VehicleFixedExpenseAmount2,
            FE.[金額3] AS VehicleFixedExpenseAmount3,
            FE.[金額4] AS VehicleFixedExpenseAmount4,
            FE.[金額5] AS VehicleFixedExpenseAmount5,
            FE.[金額6] AS VehicleFixedExpenseAmount6,
            FE.[金額7] AS VehicleFixedExpenseAmount7,
            FE.[金額8] AS VehicleFixedExpenseAmount8,
            FE.[金額9] AS VehicleFixedExpenseAmount9,
            FE.[金額10] AS VehicleFixedExpenseAmount10,
            FE.[金額11] AS VehicleFixedExpenseAmount11,
            FE.[金額12] AS VehicleFixedExpenseAmount12

        FROM 固定経費マスタ FE WITH(NOLOCK)

        LEFT JOIN 経費マスタ E WITH(NOLOCK)
            ON FE.[経費コード] = E.[経費コード]

        LEFT JOIN 運転手マスタ D WITH(NOLOCK)
            ON FE.[運転手コード] = D.[運転手コード]

        WHERE FE.[車輌コード] = @Code

        ORDER BY
            FE.[経費コード],
            FE.[車輌コード],
            FE.[キー];
        ";

            using var connection = _connectionFactory.CreateConnection();

            var result = await connection.QueryAsync<VehicleMasterResultDto>(
                sql,
                new { Code = code }
            );

            return result;
        }

        public async Task<string?> GetNextCodeAsync()
        {
            const string sql = @"
        SELECT MAX(TRY_CONVERT(BIGINT, 車輌コード))
        FROM 車輌マスタ WITH (NOLOCK)
        WHERE TRY_CONVERT(BIGINT, 車輌コード) IS NOT NULL;
    ";

            using var conn = _connectionFactory.CreateConnection();

            // Use 64-bit integer to support vehicle codes up to 9999999999.
            var maxCode = await conn.ExecuteScalarAsync<long?>(sql);

            long currentCode = maxCode ?? 0L;

            // Maximum supported vehicle code is 9999999999.
            if (currentCode >= 9_999_999_999L)
            {
                return string.Empty;
            }

            long nextCode = currentCode + 1;

            return nextCode.ToString("D10");
        }


        // =========================================
        // F7: GET PREVIOUS VEHICLE CODE
        // =========================================
        public async Task<string?> GetPreviousCodeAsync(string code)
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT TOP 1");
            sql.AppendLine("    車輌コード");
            sql.AppendLine("FROM 車輌マスタ WITH(NOLOCK)");
            sql.AppendLine("WHERE 車輌コード < @Code");
            sql.AppendLine("ORDER BY 車輌コード DESC;");

            using var conn = _connectionFactory.CreateConnection();

            return await conn.ExecuteScalarAsync<string?>(
                sql.ToString(),
                new { Code = code });
        }

        // =========================================
        // F8: GET NEXT VEHICLE CODE
        // =========================================
        public async Task<string?> GetNextCodeAsync(string code)
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT TOP 1");
            sql.AppendLine("    車輌コード");
            sql.AppendLine("FROM 車輌マスタ WITH(NOLOCK)");
            sql.AppendLine("WHERE 車輌コード > @Code");
            sql.AppendLine("ORDER BY 車輌コード ASC;");

            using var conn = _connectionFactory.CreateConnection();

            return await conn.ExecuteScalarAsync<string?>(
                sql.ToString(),
                new { Code = code });
        }


        // =========================================
        // F4: DELETE VEHICLE AND FIXED EXPENSES
        // =========================================
        public async Task<bool> DeleteVehicleAsync(string vehicleCode)
        {
            using var conn = _connectionFactory.CreateConnection();

            if (conn.State != System.Data.ConnectionState.Open)
            {
                conn.Open();
            }

            using var transaction = conn.BeginTransaction();

            try
            {
                // Check whether the vehicle exists.
                var checkSql = new StringBuilder();

                checkSql.AppendLine("SELECT COUNT(1)");
                checkSql.AppendLine("FROM 車輌マスタ");
                checkSql.AppendLine("WHERE 車輌コード = @VehicleCode;");

                var vehicleExists = await conn.ExecuteScalarAsync<int>(
                    checkSql.ToString(),
                    new { VehicleCode = vehicleCode },
                    transaction);

                if (vehicleExists == 0)
                {
                    transaction.Rollback();
                    return false;
                }

                // Delete fixed expenses associated with this vehicle.
                //var expenseSql = new StringBuilder();

                //expenseSql.AppendLine("DELETE FROM 固定経費マスタ");
                //expenseSql.AppendLine("WHERE 車輌コード = @VehicleCode;");

                //await conn.ExecuteAsync(
                //    expenseSql.ToString(),
                //    new { VehicleCode = vehicleCode },
                //    transaction);

                // Delete the vehicle record.
                var vehicleSql = new StringBuilder();

                vehicleSql.AppendLine("DELETE FROM 車輌マスタ");
                vehicleSql.AppendLine("WHERE 車輌コード = @VehicleCode;");

                var deletedRows = await conn.ExecuteAsync(
                    vehicleSql.ToString(),
                    new { VehicleCode = vehicleCode },
                    transaction);

                if (deletedRows != 1)
                {
                    transaction.Rollback();
                    return false;
                }

                transaction.Commit();
                return true;
            }
            catch
            {
                try
                {
                    transaction.Rollback();
                }
                catch
                {
                    // Preserve the original exception if rollback also fails.
                }

                throw;
            }
        }

        // =====================================================
        // Save vehicle, tire settings, and fixed expenses.
        // All changes are committed or rolled back together.
        // =====================================================
        public async Task SaveAsync(VehicleMasterSaveDto request)
        {
            using var connection = _connectionFactory.CreateConnection();

            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }

            using var transaction =
                connection.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                const string checkSql = """
                    SELECT COUNT(1)
                    FROM 車輌マスタ
                    WHERE 車輌コード = @VehicleCode;
                    """;

                var exists = await connection.ExecuteScalarAsync<int>(
                    checkSql,
                    new { request.VehicleCode },
                    transaction);

                if (exists == 0)
                {
                    await InsertVehicleAsync(
                        connection, transaction, request, _clientNo);
                }
                else
                {
                    await UpdateVehicleAsync(connection, transaction, request, _clientNo);

                }

                await SaveTiresAsync(connection, transaction, request, _clientNo);

                await SaveFixedExpensesAsync(connection, transaction, request, _clientNo);

                transaction.Commit();
            }
            catch
            {
                try
                {
                    transaction.Rollback();
                }
                catch
                {
                    // Preserve the original exception.
                }

                throw;
            }
        }

        // =====================================================
        // Insert a new vehicle.
        // =====================================================
        private static async Task InsertVehicleAsync(
            IDbConnection connection,
    IDbTransaction transaction,
    VehicleMasterSaveDto r,
    string clientNo)
        {
            const string sql = """
                INSERT INTO 車輌マスタ
                (
                    車輌コード,
                    車番,
                    メーカー名,
                    車種,
                    形式,
                    車台番号,
                    エンジン,
                    初年度,
                    登録年月日,
                    車検日,
                    総走行Km,
                    最大積載重量,
                    最大積載容量,
                    車輌形態,
                    運賃形態,
                    納車日,
                    廃車日,
                    車輌区分,
                    業務区分,
                    車種区分,
                    部門コード,
                    運転手コード,
                    ETCカード,
                    デジタココード,
                    デジタココード2,
                    O基準Km,
                    O交換日,
                    O交換Km,
                    手当掛率,
                    備考,
                    並び順,
                    登録日,
                    送信済,
                    入力端末,
                    削除,
                    配車表示
                )
                VALUES
                (
                    @VehicleCode,
                    @CarNumber,
                    @MakerName,
                    '',
                    @Model,
                    @ChassisNumber,
                    @Engine,
                    @FirstYear,
                    @RegistrationDate,
                    @InspectionDate,
                    @TotalDistanceTraveled,
                    @MaximumLoadCapacity,
                    0,
                    '',
                    @TransportTypeCode,
                    @DeliveryDate,
                    @DeregistrationDate,
                    @VehicleTypeCode,
                    '',
                    '',
                    @DepartmentCode,
                    '',
                    @EtcCardNumber,
                    @DigitalTachographCode,
                    '',
                    @OilExchangeCriteriaKm,
                    @OilLastExchangeDate,
                    @OilAfterReplacementKm,
                    @VehicleAllowanceRate,
                    '',
                    0,
                    GETDATE(),
                    '1',
                    @ClientNo,
                    '0',
                    @DispatchDisplay
                );
                """;

            await connection.ExecuteAsync(
                sql,
                new
                {
                    r.VehicleCode,
                    r.CarNumber,
                    r.MakerName,
                    r.Model,
                    r.ChassisNumber,
                    r.Engine,
                    r.FirstYear,
                    r.RegistrationDate,
                    r.InspectionDate,
                    r.TotalDistanceTraveled,
                    r.MaximumLoadCapacity,
                    r.TransportTypeCode,
                    r.DeliveryDate,
                    r.DeregistrationDate,
                    r.VehicleTypeCode,
                    r.DepartmentCode,
                    r.EtcCardNumber,
                    r.DigitalTachographCode,
                    r.OilExchangeCriteriaKm,
                    r.OilLastExchangeDate,
                    r.OilAfterReplacementKm,
                    r.VehicleAllowanceRate,
                    ClientNo = clientNo,
                    DispatchDisplay = r.HideFromDispatch ? "1" : "0"
                },
                transaction);
        }

        // =====================================================
        // Update an existing vehicle.
        // =====================================================
        private static async Task UpdateVehicleAsync(
               IDbConnection connection,
    IDbTransaction transaction,
    VehicleMasterSaveDto r,
    string clientNo)
        {
            const string sql = """
                UPDATE 車輌マスタ
                SET
                    車番 = @CarNumber,
                    メーカー名 = @MakerName,
                    形式 = @Model,
                    車台番号 = @ChassisNumber,
                    エンジン = @Engine,
                    初年度 = @FirstYear,
                    登録年月日 = @RegistrationDate,
                    車検日 = @InspectionDate,
                    総走行Km = @TotalDistanceTraveled,
                    最大積載重量 = @MaximumLoadCapacity,
                    運賃形態 = @TransportTypeCode,
                    納車日 = @DeliveryDate,
                    廃車日 = @DeregistrationDate,
                    車輌区分 = @VehicleTypeCode,
                    部門コード = @DepartmentCode,
                手当掛率 = @VehicleAllowanceRate,
                    ETCカード = @EtcCardNumber,
                    デジタココード = @DigitalTachographCode,
                    O基準Km = @OilExchangeCriteriaKm,
                    O交換日 = @OilLastExchangeDate,
                    O交換Km = @OilAfterReplacementKm,
                    配車表示 = @DispatchDisplay,
                    登録日 = GETDATE(),
                    送信済 = '1',
                入力端末 = @ClientNo,
                    削除 = '0'
                WHERE 車輌コード = @VehicleCode;
                """;

            await connection.ExecuteAsync(
                sql,
                new
                {
                    r.VehicleCode,
                    r.CarNumber,
                    r.MakerName,
                    r.Model,
                    r.ChassisNumber,
                    r.Engine,
                    r.FirstYear,
                    r.RegistrationDate,
                    r.InspectionDate,
                    r.TotalDistanceTraveled,
                    r.MaximumLoadCapacity,
                    r.TransportTypeCode,
                    r.DeliveryDate,
                    r.DeregistrationDate,
                    r.VehicleTypeCode,
                    r.DepartmentCode,
                    r.VehicleAllowanceRate,
                    ClientNo = clientNo,
                    r.EtcCardNumber,
                    r.DigitalTachographCode,
                    r.OilExchangeCriteriaKm,
                    r.OilLastExchangeDate,
                    r.OilAfterReplacementKm,
                    DispatchDisplay = r.HideFromDispatch ? "1" : "0"
                },
                transaction);
        }

        // =====================================================
        // Save all 22 tire positions.
        // Missing positions are saved with zero/null values.
        // =====================================================
        private static async Task SaveTiresAsync(
              IDbConnection connection,
    IDbTransaction transaction,
    VehicleMasterSaveDto request,
    string clientNo)
        {
            const string deleteSql = """
                DELETE FROM 車輌タイヤマスタ
                WHERE 車輌コード = @VehicleCode;
                """;

            await connection.ExecuteAsync(
                deleteSql,
                new { request.VehicleCode },
                transaction);

            const string insertSql = """
                INSERT INTO 車輌タイヤマスタ
                (
                    車輌コード,
                    位置コード,
                    T基準Km,
                    T交換日,
                    T交換Km,
                    登録日,
                    送信済,
                    入力端末,
                    削除
                )
                VALUES
                (
                    @VehicleCode,
                    @PositionCode,
                    @CriteriaKm,
                    @ExchangeDate,
                    @AfterReplacementKm,
                    GETDATE(),
                    '1',
                    @ClientNo,
                    '0'
                );
                """;

            var tires = Enumerable.Range(1, 22)
                .Select(position =>
                {
                    var tire = request.Tires.FirstOrDefault(
                        t => t.PositionCode == position);

                    return new
                    {
                        request.VehicleCode,
                        PositionCode = position,
                        CriteriaKm = tire?.CriteriaKm ?? 0m,
                        ExchangeDate = tire?.ExchangeDate,
                        AfterReplacementKm =
         tire?.AfterReplacementKm ?? 0m,
                        ClientNo = clientNo
                    };
                })
                .ToList();

            await connection.ExecuteAsync(
                insertSql,
                tires,
                transaction);
        }

        // =====================================================
        // Replace the vehicle's fixed-expense records.
        // Generate unique keys for all inserted records.
        // =====================================================
        private static async Task SaveFixedExpensesAsync(
    IDbConnection connection,
    IDbTransaction transaction,
    VehicleMasterSaveDto request,
    string clientNo)
        {
            // No fixed expenses to save.
            if (request.FixedExpenses == null ||
                request.FixedExpenses.Count == 0)
            {
                const string deleteAllSql = """
            DELETE FROM 固定経費マスタ
            WHERE 車輌コード = @VehicleCode;
            """;

                await connection.ExecuteAsync(
                    deleteAllSql,
                    new { request.VehicleCode },
                    transaction);

                return;
            }

            // Retrieve existing keys belonging to this vehicle.
            const string existingKeysSql = """
        SELECT [キー]
        FROM 固定経費マスタ WITH (UPDLOCK, HOLDLOCK)
        WHERE 車輌コード = @VehicleCode;
        """;

            var existingKeys = (
                await connection.QueryAsync<int>(
                    existingKeysSql,
                    new { request.VehicleCode },
                    transaction)
            ).ToHashSet();

            // Get the global maximum key BEFORE deleting existing rows.
            const string maxKeySql = """
        SELECT ISNULL(MAX([キー]), 0)
        FROM 固定経費マスタ WITH (UPDLOCK, HOLDLOCK);
        """;

            var maxKey = await connection.ExecuteScalarAsync<int>(
                maxKeySql,
                transaction: transaction);

            // Preserve existing keys and generate keys only for new rows.
            var nextKey = maxKey;
            var usedKeys = new HashSet<int>();

            var expenses = request.FixedExpenses
                .Select(expense =>
                {
                    int key;

                    if (expense.Key > 0)
                    {
                        // Existing row: preserve its original key.
                        key = expense.Key;

                        // Ensure the key belongs to this vehicle.
                        if (!existingKeys.Contains(key))
                        {
                            throw new InvalidOperationException(
                                $"固定経費キーが不正です: {key}");
                        }
                    }
                    else
                    {
                        // New row: generate the next global key.
                        key = checked(++nextKey);
                    }

                    // Prevent duplicate keys in the save request.
                    if (!usedKeys.Add(key))
                    {
                        throw new InvalidOperationException(
                            $"固定経費キーが重複しています: {key}");
                    }

                    return new
                    {
                        Key = key,
                        expense.DriverCode,
                        expense.ExpenseCode,
                        request.VehicleCode,
                        expense.SplitMethod,
                        expense.Amount,
                        expense.Amount1,
                        expense.Amount2,
                        expense.Amount3,
                        expense.Amount4,
                        expense.Amount5,
                        expense.Amount6,
                        expense.Amount7,
                        expense.Amount8,
                        expense.Amount9,
                        expense.Amount10,
                        expense.Amount11,
                        expense.Amount12,
                        ClientNo = clientNo
                    };
                })
                .ToList();

            // Delete existing rows only after preserving and validating their keys.
            const string deleteSql = """
        DELETE FROM 固定経費マスタ
        WHERE 車輌コード = @VehicleCode;
        """;

            await connection.ExecuteAsync(
                deleteSql,
                new { request.VehicleCode },
                transaction);

            // Keep the existing INSERT statement and its columns unchanged.
            const string insertSql = """
        INSERT INTO 固定経費マスタ
        (
            [キー],
            運転手コード,
            経費コード,
            車輌コード,
            分割方法,
            金額,
            金額1,
            金額2,
            金額3,
            金額4,
            金額5,
            金額6,
            金額7,
            金額8,
            金額9,
            金額10,
            金額11,
            金額12,
            登録日,
            送信済,
            入力端末,
            削除
        )
        VALUES
        (
            @Key,
            @DriverCode,
            @ExpenseCode,
            @VehicleCode,
            @SplitMethod,
            @Amount,
            @Amount1,
            @Amount2,
            @Amount3,
            @Amount4,
            @Amount5,
            @Amount6,
            @Amount7,
            @Amount8,
            @Amount9,
            @Amount10,
            @Amount11,
            @Amount12,
            GETDATE(),
            '1',
            @ClientNo,
            '0'
        );
        """;

            await connection.ExecuteAsync(
                insertSql,
                expenses,
                transaction);
        }

        public async Task<IEnumerable<VehicleRepairHistoryDto>>
    GetRepairHistoryAsync(
        string vehicleCode,
        string? expenseCategoryCode,
        string? expenseCode,
        string? expenseName,
        DateTime? fromDate,
        DateTime? toDate)
        {
            const string sql = @"
        SELECT
            ED.精算日 AS SettlementDate,
            ED.運転手コード AS DriverCode,
            D.運転手名 AS DriverName,
            ED.経費名 AS ExpenseName,
            ED.数量 AS Quantity,
            ED.単価 AS UnitPrice,
            ED.金額 AS Amount,
            ED.日報NO AS DailyReportNo,
            DH.帰庫M AS ReturnMileage
        FROM 経費データ ED
        LEFT JOIN 経費マスタ E
            ON ED.経費コード = E.経費コード
        LEFT JOIN 運転手マスタ D
            ON ED.運転手コード = D.運転手コード
        LEFT JOIN 日報HEAD DH
            ON ED.日報NO = DH.日報NO
        WHERE
            ED.車輌コード = @Vehicle
            AND (
                @KeihiKubun IS NULL
                OR E.経費区分コード = @KeihiKubun
            )
           AND (
    @KeihiName IS NULL
    OR ED.経費名 LIKE @KeihiName
)
            AND (
                @KeihiCode IS NULL
                OR ED.経費コード = @KeihiCode
            )
            AND (
                @FromDate IS NULL
                OR ED.精算日 >= @FromDate
            )
            AND (
                @ToDate IS NULL
                OR ED.精算日 < DATEADD(DAY, 1, @ToDate)
            )
        ORDER BY
            ED.精算日 DESC,
            ED.日報NO DESC,
            ED.行NO DESC;
    ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryAsync<VehicleRepairHistoryDto>(
                sql,
                new
                {
                    Vehicle = vehicleCode,
                    KeihiKubun = expenseCategoryCode,
                    KeihiName = expenseName,
                    KeihiCode = expenseCode,
                    FromDate = fromDate,
                    ToDate = toDate
                });
        }

        // =========================================
        // F4: CHECK WHETHER VEHICLE CAN BE DELETED
        // =========================================
        public async Task<string?> CheckDeleteAsync(string vehicleCode)
        {
            using var connection = _connectionFactory.CreateConnection();

            // 1. 運転手マスタ
            // Always check whether the vehicle is assigned to a driver.
            const string driverSql = """
    SELECT TOP 1 [車輌コード]
    FROM [運転手マスタ] WITH (NOLOCK)
    WHERE [車輌コード] = @VehicleCode;
    """;

            var driverExists =
                await connection.QueryFirstOrDefaultAsync<string>(
                    driverSql,
                    new { VehicleCode = vehicleCode });

            if (driverExists != null)
            {
                return "運転手マスタに登録されていますので削除できません！！";
            }

            // 2. 作業明細
            const string workDetailSql = """
        SELECT TOP 1 [車輌コード]
        FROM [作業明細] WITH (NOLOCK)
        WHERE [車輌コード] = @VehicleCode;
        """;

            var workDetailExists =
                await connection.QueryFirstOrDefaultAsync<string>(
                    workDetailSql,
                    new { VehicleCode = vehicleCode });

            if (workDetailExists != null)
            {
                return "受注データに登録されていますので、削除出来ません！！";
            }

            // 3. 日報HEAD
            const string dailyReportSql = """
        SELECT TOP 1 [車輌コード]
        FROM [日報HEAD] WITH (NOLOCK)
        WHERE [車輌コード] = @VehicleCode;
        """;

            var dailyReportExists =
                await connection.QueryFirstOrDefaultAsync<string>(
                    dailyReportSql,
                    new { VehicleCode = vehicleCode });

            if (dailyReportExists != null)
            {
                return "日報データに登録されていますので、削除出来ません！！";
            }

            // 4. 経費データ
            const string expenseSql = """
        SELECT TOP 1 [車輌コード]
        FROM [経費データ] WITH (NOLOCK)
        WHERE [車輌コード] = @VehicleCode;
        """;

            var expenseExists =
                await connection.QueryFirstOrDefaultAsync<string>(
                    expenseSql,
                    new { VehicleCode = vehicleCode });

            if (expenseExists != null)
            {
                return "経費データに登録されていますので、削除出来ません！！";
            }

            // 5. 高速データ
            const string highwaySql = """
        SELECT TOP 1 [車輌コード]
        FROM [高速データ] WITH (NOLOCK)
        WHERE [車輌コード] = @VehicleCode;
        """;

            var highwayExists =
                await connection.QueryFirstOrDefaultAsync<string>(
                    highwaySql,
                    new { VehicleCode = vehicleCode });

            if (highwayExists != null)
            {
                return "高速データに登録されていますので、削除出来ません！！";
            }

            // All checks passed.
            return null;
        }

    }
}