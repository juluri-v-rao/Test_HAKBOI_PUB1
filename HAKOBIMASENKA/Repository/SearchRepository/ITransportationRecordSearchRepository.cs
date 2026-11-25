using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface ITransportationRecordSearchRepository
    {
        Task<IEnumerable<TransportationRecordSearchResultDto>> SearchAsync(
            string? transportationRecordName);
    }
}