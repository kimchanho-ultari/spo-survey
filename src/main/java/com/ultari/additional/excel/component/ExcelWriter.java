package com.ultari.additional.excel.component;

import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.ultari.additional.excel.constant.ExcelConstant;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ExcelWriter {
	private Workbook workbook;
	private Map<String, Object> model;
	private HttpServletResponse response;
	
	public ExcelWriter(Workbook workbook, Map<String, Object> model, HttpServletResponse response) {
		this.workbook = workbook;
		this.model = model;
		this.response = response;
	}
	
	public void create() {
		setFileName(response, mapToFileName());
		
		String type = (String) mapToType();
		
		if (type.equals("org")) {
			Sheet sheet = workbook.createSheet();
			
			createHead(sheet, mapToHeadList());
			
			createBody(sheet, mapToBodyList());
		} else {
			@SuppressWarnings("unchecked")
			List<Map<String, Object>> list = (List<Map<String, Object>>) model.get("data");
			
			for (Map<String, Object> item : list) {
				String sheetName = (String) item.get("sheetName");
				Sheet sheet = workbook.createSheet(sheetName);
				
				createHead(sheet, mapToHeadList(item));
				
				createBody(sheet, mapToBodyList(item), bodyMarkList(item));
			}
		}
	}
	
	private String mapToType() {
		return (String) model.get(ExcelConstant.TYPE);
	}
	
	private String mapToFileName() {
		return (String) model.get(ExcelConstant.FILE_NAME);
	}
	
	@SuppressWarnings("unchecked")
	private List<String> mapToHeadList() {
		return (List<String>) model.get(ExcelConstant.HEAD);
	}
	
	@SuppressWarnings("unchecked")
	private List<List<String>> mapToBodyList() {
		return (List<List<String>>) model.get(ExcelConstant.BODY);
	}
	
	@SuppressWarnings("unchecked")
	private List<String> mapToHeadList(Map<String, Object> model) {
		return (List<String>) model.get(ExcelConstant.HEAD);
	}
	
	@SuppressWarnings("unchecked")
	private List<List<String>> mapToBodyList(Map<String, Object> model) {
		return (List<List<String>>) model.get(ExcelConstant.BODY);
	}
	
	@SuppressWarnings("unchecked")
	private List<Integer> bodyMarkList(Map<String, Object> model) {
		return (List<Integer>) model.get(ExcelConstant.MARK);
	}
	
	private void setFileName(HttpServletResponse response, String fileName) {
		StringBuilder sb = new StringBuilder();
		try {
			sb.append("attachment; filename=\"").append(new String(getFileExtension(fileName).getBytes("utf-8"), "8859_1")).append("\"");
		} catch(Exception e) {
			sb.append("attachment; filename=\"").append(getFileExtension(fileName)).append("\"");
		}
		
		response.setHeader("Content-Disposition", sb.toString());
	}
	
	private String getFileExtension(String fileName) {
		if (workbook instanceof XSSFWorkbook) {
			fileName += ".xlsx";
		} else if (workbook instanceof SXSSFWorkbook) {
			fileName += ".xlsx";
		} else if (workbook instanceof HSSFWorkbook) {
			fileName += ".xls";
		}
		
		return fileName;
	}
	
	private void createHead(Sheet sheet, List<String> headList) {
		Font font = workbook.createFont();
		font.setBold(true);
		font.setFontName("맑은고딕");
		font.setFontHeightInPoints((short) 13);
		
		CellStyle style = workbook.createCellStyle();
		style.setVerticalAlignment(VerticalAlignment.CENTER);
		style.setFont(font);
		createRow(sheet, headList, 0, style);
	}
	
	private void createBody(Sheet sheet, List<List<String>> bodyList) {
		int rowSize = bodyList.size();
		for (int i = 0; i < rowSize; i++) {
			createRow(sheet, bodyList.get(i), i + 1);
		}
	}
	
	private void createBody(Sheet sheet, List<List<String>> bodyList, List<Integer> list) {
		Font font = workbook.createFont();
		font.setFontName("맑은고딕");
		
		CellStyle style = workbook.createCellStyle();
		style.setVerticalAlignment(VerticalAlignment.CENTER);
		style.setFont(font);
		
		CellStyle style2 = workbook.createCellStyle();
		style2.setVerticalAlignment(VerticalAlignment.CENTER);
		style2.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
		style2.setFillPattern(FillPatternType.SOLID_FOREGROUND);
		style2.setFont(font);
		
		
		int rowSize = bodyList.size();
		for (int i = 0; i < rowSize; i++) {
			if (list != null && list.contains(i)) {
				createRow(sheet, bodyList.get(i), i + 1, style2);
			} else {
				createRow(sheet, bodyList.get(i), i + 1, style);
			}
			
		}
	}
	
	private void createRow(Sheet sheet, List<String> cellList, int rowNum) {
		log.debug(cellList.toString());
		int size = cellList.size();
		Row row = sheet.createRow(rowNum);
		CellStyle style = workbook.createCellStyle();
		DataFormat format = workbook.createDataFormat();
		style.setDataFormat(format.getFormat("@"));
		
		for (int i = 0; i < size; i++) {
			Cell cell = row.createCell(i);
			cell.setCellStyle(style);
			cell.setCellValue(cellList.get(i));
		}
	}
	
	private void createRow(Sheet sheet, List<String> cellList, int rowNum, CellStyle style) {
		int size = cellList.size();
		Row row = sheet.createRow(rowNum);
		
		DataFormat format = workbook.createDataFormat();
		style.setDataFormat(format.getFormat("@"));
		
		for (int i = 0; i < size; i++) {
			Cell cell = row.createCell(i);
			cell.setCellStyle(style);
			cell.setCellValue(cellList.get(i));
		}
	}
}