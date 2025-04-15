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
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@MapperScan(value="com.ultari.additional.mapper.migration.from", sqlSessionFactoryRef="sqlSessionFactoryOfMigrationFrom")
@EnableTransactionManagement
public class DataSourceConfigOfMigrationFrom {
	@Bean(name="dataSourceOfMigrationFrom")
	@ConfigurationProperties(prefix="spring.migration.from.datasource")
	public DataSource dataSourceOfMigrationFrom() {
		return DataSourceBuilder.create().build();
	}
	
	@Bean(name="sqlSessionFactoryOfMigrationFrom")
	public SqlSessionFactory sqlSessionFactoryOfMigrationFrom(@Qualifier("dataSourceOfMigrationFrom") DataSource dataSource, ApplicationContext applicationContext) throws Exception {
		SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
		sqlSessionFactoryBean.setDataSource(dataSource);
		sqlSessionFactoryBean.setTypeAliasesPackage("com.ultari.additional");
		sqlSessionFactoryBean.setMapperLocations(applicationContext.getResources("classpath:mybatis/migration/*.xml"));
		return sqlSessionFactoryBean.getObject();
	}
	
	@Bean(name="sqlSessiontemplateOfMigrationFrom")
	public SqlSessionTemplate sqlSessiontemplateOfMigrationFrom(SqlSessionFactory sqlSessionFactory) throws Exception {
		return new SqlSessionTemplate(sqlSessionFactory);
	}
}
