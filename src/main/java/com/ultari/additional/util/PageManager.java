package com.ultari.additional.util;

import lombok.Data;

@Data
public class PageManager {
	private int pageSize;
	private int pageBlock;
	private int pageNo;
	private int startRowNo;
	private int endRowNo;
	private int firstPageNo;
	private int finalPageNo;
	private int prevPageNo;
	private int nextPageNo;
	private int startPageNo;
	private int endPageNo;
	private int totalCount;
	
	public void makePaging() {
		if (totalCount == 0) return;
		if (pageNo == 0) setPageNo(1);
		if (pageSize == 0) setPageSize(10);
		if (pageBlock == 0) setPageBlock(10);
		
		int finalPage = (totalCount + (pageSize -1)) / pageSize;
		setFirstPageNo(1);
		setFinalPageNo(finalPage);
		
		boolean isNowFirst = pageNo == 1 ? true : false;
		boolean isNowFinal = pageNo == finalPage ? true : false;
		
		int pg = pageNo % pageBlock;
		int page = pageNo;
		if (pg == 0) {
			page--;
		}
		
		int block = (int) Math.ceil(page / pageBlock);
		
		if (isNowFirst) {
			setPrevPageNo(1);
		} else {
			int p = (block -1) * pageBlock + 1;
			if (block == 0) p = 1;
			setPrevPageNo(p);
		}
		
		if (isNowFinal) {
			setNextPageNo(finalPage);
		} else {
			int p = (block + 1) * pageBlock + 1;
			setNextPageNo(p);
		}
		
		int startPage = ((pageNo -1) / pageBlock) * pageBlock + 1;
		int endPage = startPage + pageBlock -1;
		
		if (endPage > finalPage) {
			endPage = finalPage;
		}
		
		setStartPageNo(startPage);
		setEndPageNo(endPage);
		
		//int startRowNo = ((pageNo -1) * pageSize) + 1;	// oracle
		int startRowNo = ((pageNo -1) * pageSize);		// mysql
		int endRowNo = pageNo * pageSize;
		
		setStartRowNo(startRowNo);
		setEndRowNo(endRowNo);
	}
}