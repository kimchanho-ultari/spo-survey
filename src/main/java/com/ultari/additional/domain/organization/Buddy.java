package com.ultari.additional.domain.organization;

import lombok.Data;

@Data
public class Buddy {
    private String key;
    private String userId;
    private String title;
    private String pId;
    private int sort;

    // Dept와 동일하게 추가
    private boolean isFolder = true;
    private boolean isLazy = true;
    private boolean icon = false;

    public boolean getIsFolder() {
        return isFolder;
    }
    public boolean getIsLazy() {
        return isLazy;
    }
}
