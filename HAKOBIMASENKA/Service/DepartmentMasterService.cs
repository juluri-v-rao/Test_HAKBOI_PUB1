using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Repository;

namespace HAKOBIMASENKA.Service
{
    public class DepartmentMasterService
        : IDepartmentMasterService
    {
        private readonly IDepartmentMasterRepository _repository;

        public DepartmentMasterService(
            IDepartmentMasterRepository repository)
        {
            _repository = repository;
        }


        public async Task<List<DepartmentMasterResultDto>>
            GetListAsync()
        {
            return await _repository.GetListAsync();
        }
        public async Task<string?> GetNextCodeAsync()
        {
            return await _repository.GetNextCodeAsync();
        }
        public async Task<int> DeleteAsync(string departmentCode)
        {
            return await _repository.DeleteAsync(departmentCode);
        }
        public async Task<int> SaveAsync(
    string departmentCode,
    string departmentName)
        {
            return await _repository.SaveAsync(
                departmentCode,
                departmentName);
        }
    }
}