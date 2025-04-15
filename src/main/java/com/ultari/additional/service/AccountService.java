package com.ultari.additional.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.mapper.common.AccountMapper;

@Service
public class AccountService {
	@Autowired
	AccountMapper accountMapper;
	
	public Account memberByKey(String key) throws Exception {
		return accountMapper.memberByKey(key);
	}
	public Account managerByKey(String key) throws Exception {
		return accountMapper.managerByKey(key);
	}
}
