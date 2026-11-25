using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class TransportationRecordSearchService
        : ITransportationRecordSearchService
    {
        private readonly ITransportationRecordSearchRepository _repository;

        public TransportationRecordSearchService(
            ITransportationRecordSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<TransportationRecordSearchResultDto>> SearchAsync(
            string? transportationRecordName)
        {
            return _repository.SearchAsync(transportationRecordName);
        }
    }
}