package melo_backend.controller;

import melo_backend.model.SystemSetting;
import melo_backend.repository.SystemSettingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class SystemSettingController {

    private final SystemSettingRepository repository;

    private static final Map<String, String> DEFAULTS = new LinkedHashMap<>();

    static {
        DEFAULTS.put("siteName", "MELO");
        DEFAULTS.put("allowRegistrations", "true");
        DEFAULTS.put("maintenanceMode", "false");
        DEFAULTS.put("maxUploadSizeMB", "50");
        DEFAULTS.put("supportEmail", "support@melo.local");
    }

    public SystemSettingController(SystemSettingRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<?> getSettings() {
        Map<String, String> result = new LinkedHashMap<>(DEFAULTS);
        repository.findAll().forEach(setting -> result.put(setting.getSettingKey(), setting.getSettingValue()));
        return ResponseEntity.ok(result);
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, String> updates) {
        if (updates == null || updates.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No settings supplied."));
        }

        for (Map.Entry<String, String> entry : updates.entrySet()) {
            String key = entry.getKey() == null ? "" : entry.getKey().trim();
            if (key.isBlank() || !DEFAULTS.containsKey(key)) {
                continue;
            }

            String value = entry.getValue() == null ? "" : entry.getValue().trim();
            SystemSetting setting = repository.findBySettingKey(key)
                    .orElseGet(() -> new SystemSetting(key, value));
            setting.setSettingValue(value);
            repository.save(setting);
        }

        return getSettings();
    }
}
