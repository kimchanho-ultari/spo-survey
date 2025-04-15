package com.ultari.additional.mapper.common;

import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminMapper {
	public void regist(Map<String, Object> map) throws Exception;
}
