package com.ultari.additional.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.ExecutorType;
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
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@MapperScan(value="com.ultari.additional.mapper.migration.to", sqlSessionFactoryRef="sqlSessionFactoryOfMigrationTo")
@EnableTransactionManagement
public class DataSourceConfigOfMigrationTo {
	@Bean(name="dataSourceOfMigrationTo")
	@ConfigurationProperties(prefix="spring.migration.to.datasource")
	public DataSource dataSourceOfMigrationTo() {
		return DataSourceBuilder.create().build();
	}
	
	@Bean(name="sqlSessionFactoryOfMigrationTo")
	public SqlSessionFactory sqlSessionFactoryOfMigrationTo(@Qualifier("dataSourceOfMigrationTo") DataSource dataSource, ApplicationContext applicationContext) throws Exception {
		SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
		sqlSessionFactoryBean.setDataSource(dataSource);
		sqlSessionFactoryBean.setTypeAliasesPackage("com.ultari.additional");
		sqlSessionFactoryBean.setMapperLocations(applicationContext.getResources("classpath:mybatis/migration/*.xml"));
		return sqlSessionFactoryBean.getObject();
	}
	
	@Bean(name="sqlSessiontemplateOfMigrationTo")
	public SqlSessionTemplate sqlSessiontemplateOfMigrationTo(SqlSessionFactory sqlSessionFactory) throws Exception {
		return new SqlSessionTemplate(sqlSessionFactory, ExecutorType.BATCH);
	}
}
