namespace HAKOBIMASENKA.Helpers
{
    public class CommonHelper
    {
        public static string ZeroPad(string value, int digits)
        {
            if (string.IsNullOrEmpty(value))
            {
                return value;    
            }
            return Convert.ToInt64(value).ToString($"D{digits}");
        }

        public static string FormatDate(DateTime value, string format="yyyy/MM/dd")
        {
            return value.ToString(format);
        }
    }
}
