package com.ultari.additional.mapper.migration.to;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.ultari.additional.domain.migration.Group;
import com.ultari.additional.domain.migration.Member;

@Mapper
public interface ToMapper {
	public void removeDept() throws Exception;
	public void registDept(List<Group> list) throws Exception;
	public void removeMember() throws Exception;
	public void registMember(Member member) throws Exception;
}
