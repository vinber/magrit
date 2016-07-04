# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import unittest, time, re

firefox_capabilities = DesiredCapabilities.FIREFOX
firefox_capabilities['marionette'] = True
firefox_capabilities['binary'] = '/usr/bin/firefox'

class Test(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Firefox(capabilities=firefox_capabilities)
        self.driver.implicitly_wait(30)
        self.base_url = "http://localhost:9999"
        self.verificationErrors = []
        self.accept_next_alert = True

    def test_(self):
        driver = self.driver
        driver.get(self.base_url + "/modules/discontinuities")
        driver.find_element_by_css_selector("#sample_link > i").click()
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
        else:
            self.fail("time out")
        driver.find_element_by_id("join_button").click()
        Select(driver.find_element_by_id("button_field2")).select_by_visible_text("DEPCOM")
        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        driver.find_element_by_id("ui-id-2").click()
        Select(driver.find_element_by_id("field_Discont")).select_by_visible_text("TH")
        Select(driver.find_element_by_id("kind_Discont")).select_by_visible_text("Absolute")
        driver.find_element_by_id("yes").click()
        driver.find_element_by_css_selector("img.legend_button").click()
        driver.find_element_by_id("move_legend").click()
        driver.find_element_by_id("edit_legend").click()
        driver.find_element_by_id("precision_range").clear()
        driver.find_element_by_id("precision_range").send_keys("1")

    def is_element_present(self, how, what):
        try: self.driver.find_element(by=how, value=what)
        except NoSuchElementException as e: return False
        return True

    def is_alert_present(self):
        try: self.driver.switch_to_alert()
        except NoAlertPresentException as e: return False
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
        finally: self.accept_next_alert = True

    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
