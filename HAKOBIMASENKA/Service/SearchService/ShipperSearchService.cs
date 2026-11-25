using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;
using System.Xml.Linq;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class ShipperSearchService : IShipperSearchService
    {
        private readonly IShipperSearchRepository _repository;

        public ShipperSearchService(
            IShipperSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<ShipperSearchPopUpResultDto>> SearchAsync(string? furigana,
            string? name,
            string? phoneNumber,
            bool activeOnly = false)
        {
            return _repository.SearchAsync(
                furigana,
                name,
                phoneNumber,
                activeOnly);
        }
    }
}