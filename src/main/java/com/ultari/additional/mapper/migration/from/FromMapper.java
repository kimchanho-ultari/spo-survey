package com.ultari.additional.mapper.migration.from;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.ultari.additional.domain.migration.Group;
import com.ultari.additional.domain.migration.Member;

@Mapper
public interface FromMapper {
	public List<Group> deptList() throws Exception;
	public List<Member> memberList() throws Exception;
}
