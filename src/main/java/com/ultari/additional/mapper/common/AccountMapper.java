package com.ultari.additional.mapper.common;

import org.apache.ibatis.annotations.Mapper;

import com.ultari.additional.domain.account.Account;

@Mapper
public interface AccountMapper {
	Account memberByKey(String key) throws Exception;
	Account managerByKey(String key) throws Exception;
}
