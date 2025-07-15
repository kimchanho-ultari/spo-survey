package com.ultari.additional.mapper.common;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.ultari.additional.domain.organization.Dept;
import com.ultari.additional.domain.organization.User;

@Mapper
public interface OrganizationMapper {
	public List<Dept> deptListByPid(Map<String, Object> map) throws Exception;
	public List<Dept> deptListAll() throws Exception;
	
	public List<User> memberByDeptId(Map<String, Object> map) throws Exception;
	public List<User> memberByDeptIdPaging(Map<String, Object> map) throws Exception;
	public List<User> memberByKeyword(Map<String, Object> map) throws Exception;
	public List<User> memberByKeywordPaging(Map<String, Object> map) throws Exception;
	public List<User> memberAll() throws Exception;
	public List<User> memberByDeptIdList(Map<String, Object> map) throws Exception;
	
	public int totalCntForMemberByDeptId(Map<String, Object> map) throws Exception;
	public int totalCntForMemberByKeyword(Map<String, Object> map) throws Exception;
	
	public void registMember(User user) throws Exception;
	public void modifyMember(User user) throws Exception;
	public void removeMember(Map<String, Object> map) throws Exception;
	public void moveMember(Map<String, Object> map) throws Exception;
	
	public User memberById(String key) throws Exception;
	
	public void resetFailedPasswordCount(String key) throws Exception;

	public List<Map<String, String>> findBuddyList(String userId, String buddyParent);

	List<Map<String, String>> findBuddyGroupList(String userId, String buddyParent);
	List<Map<String, String>> findBuddyMemberList(String userId, String buddyParent);
}
