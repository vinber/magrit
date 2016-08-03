# -*- coding: utf-8 -*-
"""
@author: mthh
"""

# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import unittest, time, re

class BasicStartupNuts2(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.PhantomJS("/home/mz/phantomjs-2.1.1-linux-x86_64/bin/phantomjs")
        self.driver.implicitly_wait(10)
        self.driver.set_window_size(1600, 900)
        self.base_url = "http://192.168.56.1:9999/"
        self.verificationErrors = []
        self.accept_next_alert = True

    def test_basic_startup_nuts2(self):
        driver = self.driver
        driver.get(self.base_url + "/modules")
        driver.find_element_by_css_selector("#sample_link > b").click()
        Select(driver.find_element_by_css_selector("select.sample_target")).select_by_visible_text("Nuts 2 (2006) European subdivisions (Polygons)")
        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        for i in range(60):
            try:
                if self.is_element_present(By.CSS_SELECTOR, "button.swal2-confirm.styled"): break
            except: pass
            time.sleep(1)
        else: self.fail("time out")
        driver.find_element_by_css_selector("button.swal2-confirm.styled").click()

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
