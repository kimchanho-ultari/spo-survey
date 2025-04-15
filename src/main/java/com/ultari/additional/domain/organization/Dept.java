package com.ultari.additional.domain.organization;

import lombok.Data;

@Data
public class Dept {
	private String key;
	private String title;
	private String pId;
	private int sort;
	
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
