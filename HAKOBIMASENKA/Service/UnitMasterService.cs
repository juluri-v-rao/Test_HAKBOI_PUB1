using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Repository;

namespace HAKOBIMASENKA.Service
{
    public class UnitMasterService : IUnitMasterService
    {
        private readonly IUnitMasterRepository _repository;

        public UnitMasterService(
            IUnitMasterRepository repository)
        {
            _repository = repository;
        }


        public async Task<List<UnitMasterResultDto>> GetListAsync()
        {
            return await _repository.GetListAsync();
        }
        public async Task<string> GetNextCodeAsync()
        {
            return await _repository.GetNextCodeAsync();
        }
        public async Task<string?> CheckDeleteAsync(string unitCode)
        {
            return await _repository.CheckDeleteAsync(unitCode);
        }
        public async Task<int> DeleteAsync(string unitCode)
        {
            return await _repository.DeleteAsync(unitCode);
        }
        public async Task<int> SaveAsync(string unitCode,string unitName,string calculationType)
        {
            return await _repository.SaveAsync(
                unitCode,
                unitName,
                calculationType);
        }
    }
}