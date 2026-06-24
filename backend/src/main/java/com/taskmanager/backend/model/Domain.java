package com.taskmanager.backend.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "domains")
public class Domain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "color_code", nullable = false)
    private String colorCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String emoji;

    // Standard Boilerplate No-Args Constructor (Required by JPA)
    public Domain() {}

    // Convenience Constructor for creating fresh objects
    public Domain(String name, String colorCode, String emoji) {
        this.name = name;
        this.colorCode = colorCode;
        this.emoji = emoji;
    }

    // ================= Getters and Setters =================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}