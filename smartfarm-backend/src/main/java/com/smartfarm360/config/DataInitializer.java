package com.smartfarm360.config;

import com.smartfarm360.model.Farm;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.FarmRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmartFarmConfig smartFarmConfig;

    @Override
    public void run(String... args) throws Exception {
        initializeData();
    }

    private void initializeData() {
        log.info("Starting data initialization...");
        
        // Always ensure system admin exists
        ensureSystemAdminExists();
        
        // Create demo users only if they don't exist
        createDemoUsersIfNotExist();
        
        // Fix any data integrity issues
        fixFarmOwnership();
        
        // Log current state
        logAllUsers();
        logDemoCredentials();
        
        log.info("Data initialization completed!");
    }
    
    private void ensureSystemAdminExists() {
        if (!userRepository.findByUsername("sysadmin").isPresent()) {
            log.info("System admin not found, creating...");
            createSystemAdmin();
        } else {
            log.info("System admin already exists");
        }
    }
    
    private void createDemoUsersIfNotExist() {
        // Create demo farm owner if not exists
        User farmOwner = createUserIfNotExists("farmowner", "farmowner@demo.com", "owner123", 
            "John", "FarmOwner", User.Role.FARM_OWNER, null);
        
        // Create demo farm if not exists
        Farm demoFarm = createDemoFarmIfNotExists(farmOwner);
        
        // Create demo supervisor if not exists
        createUserIfNotExists("supervisor", "supervisor@demo.com", "supervisor123", 
            "John", "Supervisor", User.Role.SUPERVISOR, demoFarm);
        
        // Create demo worker if not exists
        createUserIfNotExists("worker", "worker@demo.com", "worker123", 
            "Jane", "Worker", User.Role.WORKER, demoFarm);
    }
    
    private User createUserIfNotExists(String username, String email, String password, 
                                     String firstName, String lastName, User.Role role, Farm assignedFarm) {
        
        var existingUser = userRepository.findByUsername(username);
        if (existingUser.isPresent()) {
            log.info("User '{}' already exists, skipping creation", username);
            return existingUser.get();
        }
        
        log.info("Creating demo user: {}", username);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setAssignedFarm(assignedFarm);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        user = userRepository.save(user);
        log.info("Created user: username={}, email={}, role={}", username, email, role);
        return user;
    }
    
    private Farm createDemoFarmIfNotExists(User owner) {
        // Check if demo farm already exists
        var existingFarms = farmRepository.findAll();
        var demoFarm = existingFarms.stream()
            .filter(farm -> "SmartFarm Demo".equals(farm.getName()))
            .findFirst();
            
        if (demoFarm.isPresent()) {
            log.info("Demo farm already exists, skipping creation");
            return demoFarm.get();
        }
        
        log.info("Creating demo farm...");
        Farm farm = new Farm();
        farm.setName("SmartFarm Demo");
        farm.setLocation("Demo Location, Test City");
        farm.setSize(new BigDecimal("150.5"));
        farm.setSizeUnit("acres");
        farm.setDescription("Demo farm for testing SmartFarm360 application");
        farm.setOwner(owner);
        farm.setCreatedAt(LocalDateTime.now());
        farm.setUpdatedAt(LocalDateTime.now());
        
        farm = farmRepository.save(farm);
        log.info("Created demo farm: {}", farm.getName());
        return farm;
    }
    
    private void createSystemAdmin() {
        // Create system admin user (you as the system owner)
        User systemAdmin = new User();
        systemAdmin.setUsername("sysadmin");
        systemAdmin.setEmail(smartFarmConfig.getAdmin().getEmail());
        systemAdmin.setPassword(passwordEncoder.encode("admin123"));
        systemAdmin.setFirstName("System");
        systemAdmin.setLastName("Administrator");
        systemAdmin.setRole(User.Role.SYSTEM_ADMIN);
        systemAdmin.setIsActive(true);
        systemAdmin.setCreatedAt(LocalDateTime.now());
        systemAdmin.setUpdatedAt(LocalDateTime.now());
        userRepository.save(systemAdmin);
        
        log.info("System admin created: username=sysadmin, password=admin123, email={}", 
                systemAdmin.getEmail());
        
        // Debug: Log all users in database
        logAllUsers();
    }
    
    private void fixFarmOwnership() {
        try {
            // Find farms without owners and assign them to the farm owner
            var farmsWithoutOwners = farmRepository.findAll().stream()
                .filter(farm -> farm.getOwner() == null)
                .toList();
            
            if (!farmsWithoutOwners.isEmpty()) {
                var farmOwner = userRepository.findByUsername("farmowner");
                if (farmOwner.isPresent()) {
                    log.info("Fixing {} farms without owners", farmsWithoutOwners.size());
                    for (Farm farm : farmsWithoutOwners) {
                        farm.setOwner(farmOwner.get());
                        farmRepository.save(farm);
                        log.info("Assigned farm '{}' to owner '{}'", farm.getName(), farmOwner.get().getUsername());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fixing farm ownership: {}", e.getMessage());
        }
    }
    
    private void logAllUsers() {
        try {
            var allUsers = userRepository.findAll();
            log.info("=== ALL USERS IN DATABASE ===");
            log.info("Total users: {}", allUsers.size());
            for (User user : allUsers) {
                log.info("User: username={}, email={}, role={}, active={}", 
                    user.getUsername(), user.getEmail(), user.getRole(), user.getIsActive());
            }
            log.info("=== END USER LIST ===");
        } catch (Exception e) {
            log.error("Error logging users: {}", e.getMessage());
        }
    }
    
    private void logDemoCredentials() {
        log.info("");
        log.info("=== DEMO LOGIN CREDENTIALS ===");
        log.info("System Admin:");
        log.info("  Username: sysadmin");
        log.info("  Password: admin123");
        log.info("");
        log.info("Farm Owner:");
        log.info("  Username: farmowner");
        log.info("  Password: owner123");
        log.info("");
        log.info("Supervisor:");
        log.info("  Username: supervisor");
        log.info("  Password: supervisor123");
        log.info("");
        log.info("Worker:");
        log.info("  Username: worker");
        log.info("  Password: worker123");
        log.info("=== END DEMO CREDENTIALS ===");
        log.info("");
    }
}