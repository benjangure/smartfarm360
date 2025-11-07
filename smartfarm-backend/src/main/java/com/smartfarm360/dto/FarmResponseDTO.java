package com.smartfarm360.dto;

public class FarmResponseDTO {
    private Long id;
    private String name;
    private String location;
    private Double size;
    private String sizeUnit;
    private String description;
    private String ownerName;
    private String ownerEmail;

    public FarmResponseDTO() {}

    public FarmResponseDTO(Long id, String name, String location, Double size, String sizeUnit, 
                          String description, String ownerName, String ownerEmail) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.size = size;
        this.sizeUnit = sizeUnit;
        this.description = description;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getSize() { return size; }
    public void setSize(Double size) { this.size = size; }

    public String getSizeUnit() { return sizeUnit; }
    public void setSizeUnit(String sizeUnit) { this.sizeUnit = sizeUnit; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }
}