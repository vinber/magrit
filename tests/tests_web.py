# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
#from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
import subprocess
import unittest
import time

class AbcTest(unittest.TestCase):
    def setUp(self):
        self.p = subprocess.Popen(["noname_app", "--port", "8080", "--R-workers", "1"])
        time.sleep(2)
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(30)
        self.base_url = "http://localhost:8080/"
        self.verificationErrors = []
        self.accept_next_alert = True

    def test_abc(self):
        driver = self.driver
        driver.get(self.base_url + "modules")
        driver.find_element_by_css_selector("#sample_link > b").click()
        Select(driver.find_element_by_css_selector("select.sample_target")).select_by_visible_text("Nuts 3 (2006) European subdivisions (Polygons)")
        Select(driver.find_element_by_css_selector("select.sample_target")).select_by_visible_text("Nuts 2 (2006) European subdivisions (Polygons)")
        driver.find_element_by_xpath("(//button[@type='button'])[2]").click()
        for i in range(60):
            try:
                if self.is_element_present(By.CSS_SELECTOR, "button.swal2-confirm.styled"): break
            except: pass
            time.sleep(1)
        else: self.fail("time out")
        driver.find_element_by_css_selector("button.swal2-confirm.styled").click()
        driver.find_element_by_id("ui-id-3").click()
        driver.find_element_by_id("ui-id-2").click()
        driver.find_element_by_css_selector("img[title=\"Compute stewart potentials...\"]").click()
        driver.find_element_by_id("stewart_nb_class").clear()
        driver.find_element_by_id("stewart_nb_class").send_keys("7")
        driver.find_element_by_id("stewart_span").clear()
        driver.find_element_by_id("stewart_span").send_keys("60")
        Select(driver.find_element_by_id("stewart_mask")).select_by_visible_text("nuts2_data")
        driver.find_element_by_id("stewart_yes").click()
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
        self.p.terminate()
        self.p.kill()
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()

