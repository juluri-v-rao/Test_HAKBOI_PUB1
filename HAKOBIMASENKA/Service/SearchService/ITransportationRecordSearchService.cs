using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface ITransportationRecordSearchService
    {
        Task<IEnumerable<TransportationRecordSearchResultDto>> SearchAsync(
            string? transportationRecordName);
    }
}