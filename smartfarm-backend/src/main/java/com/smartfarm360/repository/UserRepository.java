package com.smartfarm360.repository;

import com.smartfarm360.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByRole(User.Role role);

    List<User> findByAssignedFarmId(Long farmId);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.assignedFarm.id = :farmId")
    List<User> findByRoleAndFarmId(@Param("role") User.Role role, @Param("farmId") Long farmId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);

    List<User> findByAssignedFarmIdAndRole(Long farmId, User.Role role);

    List<User> findByAssignedFarmIdAndRoleIn(Long farmId, List<User.Role> roles);

    @Query("SELECT w FROM User w WHERE w.role = :workerRole AND w.assignedFarm.id = (SELECT s.assignedFarm.id FROM User s WHERE s.id = :supervisorId)")
    List<User> findWorkersBySupervisorId(@Param("supervisorId") Long supervisorId,
            @Param("workerRole") User.Role workerRole);

    @Query("SELECT w FROM User w WHERE w.role = 'WORKER' AND w.assignedFarm.id = (SELECT s.assignedFarm.id FROM User s WHERE s.username = :supervisorUsername)")
    List<User> findWorkersBySupervisorUsername(@Param("supervisorUsername") String supervisorUsername);

    @Query("SELECT u.assignedFarm.id FROM User u WHERE u.username = :username")
    Long findFarmIdByUsername(@Param("username") String username);

    List<User> findByRoleAndAssignedFarmIsNotNull(User.Role role);
    
    @Query("SELECT u FROM User u JOIN u.supervisedFarms f WHERE f.id = :farmId AND u.role = 'SUPERVISOR'")
    List<User> findSupervisorsByFarmId(@Param("farmId") Long farmId);
    
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.supervisedFarms WHERE u.role = 'SUPERVISOR'")
    List<User> findAllSupervisorsWithFarms();
    
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.supervisedFarms WHERE u.id IN :userIds")
    List<User> findUsersWithSupervisedFarms(@Param("userIds") List<Long> userIds);
}