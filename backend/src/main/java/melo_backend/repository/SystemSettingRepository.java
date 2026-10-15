package melo_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import melo_backend.model.SystemSetting;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
}
