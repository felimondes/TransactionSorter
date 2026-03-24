package com.transactionapp.client.runner;

import io.cucumber.junit.platform.engine.Cucumber;
import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;

@Cucumber
@IncludeEngines("cucumber")
@SelectClasspathResource("features")  // points to src/test/resources/features
@ConfigurationParameter(
        key = GLUE_PROPERTY_NAME,
        value = "com.transactionapp.client.steps" // package with your step definitions
)
public class RunCucumberTest {
}

