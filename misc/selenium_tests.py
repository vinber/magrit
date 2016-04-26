# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import unittest, time, re

class SeleniumTests(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(45)
        self.base_url = "http://127.0.0.1:9999"
        self.verificationErrors = []
        self.accept_next_alert = True

    def test_selenium_stewart(self):
        driver = self.driver
        driver.get(self.base_url + "/modules/stewart")
        driver.find_element_by_css_selector("#section1 > div > p").click()
        Select(driver.find_element_by_css_selector("select.sample_target")).select_by_visible_text("Grand Paris municipalities (Polygons)")
        Select(driver.find_element_by_css_selector("select.sample_dataset")).select_by_visible_text("\"Grand Paris\" incomes dataset (To link with Grand Paris municipality geometries)")
        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        for i in range(60):
            try:
                if "Layer successfully added to the canvas" == self.close_alert_and_get_its_text():
                    break
            except:
                pass
            time.sleep(1)
        else: self.fail("time out")
        driver.find_element_by_id("join_button").click()
        Select(driver.find_element_by_id("button_field2")).select_by_visible_text("DEPCOM")
        driver.find_element_by_id("yes").click()
#        driver.find_element_by_id("browse_button").click()
#        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        driver.find_element_by_id("ui-id-2").click()
        driver.find_element_by_id("func_button").click()
        Select(driver.find_element_by_css_selector("select.params")).select_by_visible_text("INC")
        driver.find_element_by_css_selector("input.params").clear()
        driver.find_element_by_css_selector("input.params").send_keys("4250")
        driver.find_element_by_xpath("(//input[@value='0'])[4]").clear()
        driver.find_element_by_xpath("(//input[@value='0'])[4]").send_keys("2")
        driver.find_element_by_xpath("(//input[@value='0'])[5]").clear()
        driver.find_element_by_xpath("(//input[@value='0'])[5]").send_keys("2500")
        Select(driver.find_element_by_xpath("//div[@id='GrandParisMunicipalities_stewart_popup']/p[5]/select")).select_by_visible_text("Pareto")
        driver.find_element_by_id("yes").click()
        for i in range(75):
            try:
                if "Layer successfully added to the canvas" == self.close_alert_and_get_its_text(): break
            except: pass
            time.sleep(1)
        else: self.fail("time out")
        driver.find_element_by_id("ui-id-2").click()
        driver.find_element_by_id("ui-id-3").click()
        driver.find_element_by_xpath("(//button[@type='submit'])[8]").click()
        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        driver.find_element_by_css_selector("button.zoom_fit_button").click()
        driver.find_element_by_id("ui-id-3").click()
        driver.find_element_by_id("ui-id-2").click()
        driver.find_element_by_id("checkbox_legend").click()


    def test_selenium_choropleth(self):
        driver = self.driver
        driver.get(self.base_url + "/modules/choropleth")
        driver.find_element_by_css_selector("#section1 > div > p > i").click()
        Select(driver.find_element_by_css_selector("select.sample_target")).select_by_visible_text("Nuts 2 (2013) European subdivisions (Polygons)")
        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        self.assertEqual("Layer successfully added to the canvas", self.close_alert_and_get_its_text())
        driver.find_element_by_id("ui-id-2").click()
        driver.find_element_by_id("func_button").click()
        Select(driver.find_element_by_css_selector("select.params")).select_by_visible_text("gdppps2008")
        driver.find_element_by_xpath("//div[@id='nuts2_data_popup']/p[2]/button").click()
        Select(driver.find_element_by_css_selector("#discretization_panel > p > select.params")).select_by_visible_text("Q6")
        driver.find_element_by_id("button_Diverging").click()
        Select(driver.find_element_by_css_selector("select.color_params_right")).select_by_visible_text("Greens")
        Select(driver.find_element_by_css_selector("select.color_params_left")).select_by_visible_text("Reds")
        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        driver.find_element_by_id("yes").click()
        driver.find_element_by_id("ui-id-2").click()
        driver.find_element_by_id("checkbox_legend").click()
        driver.find_element_by_css_selector("button.const_buttons").click()
    
    def is_element_present(self, how, what):
        try:
            self.driver.find_element(by=how, value=what)
        except NoSuchElementException as e:
                return False
        return True
    
    def is_alert_present(self):
        try:
            self.driver.switch_to_alert()
        except NoAlertPresentException as e:
            return False
        return True
    
    def close_alert_and_get_its_text(self):
        try:
            alert = self.driver.switch_to_alert()
            alert_text = alert.text
            if self.accept_next_alert:
                alert.accept()
            else:
                alert.dismiss()
            return alert_text
        finally:
            self.accept_next_alert = True
    
    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
