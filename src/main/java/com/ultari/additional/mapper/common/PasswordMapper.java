package com.ultari.additional.mapper.common;

import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PasswordMapper {
	void regist(Map<String, Object> map) throws Exception;
	void remove(Map<String, Object> map) throws Exception;
	String passwordByKey(Map<String, Object> map) throws Exception;
}
