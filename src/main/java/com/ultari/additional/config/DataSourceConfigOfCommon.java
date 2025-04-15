package com.ultari.additional.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@MapperScan(value = "com.ultari.additional.mapper.common", sqlSessionFactoryRef = "sqlSessionFactoryOfCommon")
@EnableTransactionManagement
public class DataSourceConfigOfCommon {
	@Bean(name = "dataSourceOfCommon")
	@Primary
	@ConfigurationProperties(prefix = "spring.common.datasource")
	public DataSource dataSourceOfCommon() {
		return DataSourceBuilder.create().build();
	}
	
	@Bean(name = "sqlSessionFactoryOfCommon")
	@Primary
	public SqlSessionFactory sqlSessionFactoryOfCommon(@Qualifier("dataSourceOfCommon") DataSource dataSource, ApplicationContext applicationContext) throws Exception {
		SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
		sqlSessionFactoryBean.setDataSource(dataSource);
		sqlSessionFactoryBean.setTypeAliasesPackage("com.ultari.additional");
		sqlSessionFactoryBean.setMapperLocations(applicationContext.getResources("classpath:mybatis/common/*.xml"));
		return sqlSessionFactoryBean.getObject();
	}
	
	@Bean(name="sqlSessiontemplateOfCommon")
	@Primary
	public SqlSessionTemplate sqlSessiontemplateOfMsg(SqlSessionFactory sqlSessionFactory) throws Exception {
		return new SqlSessionTemplate(sqlSessionFactory);
	}
}
