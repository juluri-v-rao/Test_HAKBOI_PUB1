using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Repository;

namespace HAKOBIMASENKA.Service
{
    public class AreaMasterService : IAreaMasterService
    {
        private readonly IAreaMasterRepository _repository;

        public AreaMasterService(
            IAreaMasterRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<AreaMasterResultDto>> GetListAsync()
        {
            return await _repository.GetListAsync();
        }
        public async Task<int> DeleteAsync(string areaCode)
        {
            return await _repository.DeleteAsync(areaCode);
        }
        public async Task<string> GetNextAreaCodeAsync()
        {
            return await _repository.GetNextAreaCodeAsync();
        }
        public async Task<int> SaveAsync( string areaCode,string areaName,string? digitalCode)
        {
            return await _repository.SaveAsync(
                areaCode,
                areaName,
                digitalCode);
        }

    }
}