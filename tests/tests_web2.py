# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import NoAlertPresentException
from flaky import flaky
from signal import SIGINT
import psutil
import unittest
import time
from contextlib import closing
from functools import wraps
from socket import socket, AF_INET, SOCK_STREAM
from subprocess import PIPE
from uuid import uuid4
import os
import sys
try:
    import ujson as json
except ImportError:
    import json

def retry(ExceptionToCheck, tries=4, delay=2):
    """
    Retry calling a decorated function

    Credits :
      http://www.saltycrane.com/blog/2009/11/trying-out-retry-decorator-python/
      original from: http://wiki.python.org/moin/PythonDecoratorLibrary#Retry
    """
    def deco_retry(f):
        @wraps(f)
        def f_retry(*args, **kwargs):
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return f(*args, **kwargs)
                except ExceptionToCheck:
                    time.sleep(mdelay)
                    mtries -= 1
            return f(*args, **kwargs)
        return f_retry  # true decorator
    return deco_retry

# RUN_TRAVIS_SAUCELABS = os.environ.get('TRAVIS_BUILD_DIR') is not None
RUN_DOCKER = os.environ.get('RUN_TESTS_DOCKER') == 'True'
RUN_LOCAL = not RUN_DOCKER

if RUN_LOCAL:
    browsers = ['Firefox']
elif RUN_DOCKER:
    browsers = [DesiredCapabilities.CHROME,
                DesiredCapabilities.FIREFOX]


def on_platforms(platforms, local):
    if local:
        def decorator(base_class):
            module = sys.modules[base_class.__module__].__dict__
            for i, platform in enumerate(platforms):
                d = dict(base_class.__dict__)
                d['browser'] = platform
                name = "%s_%s" % (base_class.__name__, i + 1)
                module[name] = type(name, (base_class,), d)
            pass
        return decorator

    def decorator(base_class):
        module = sys.modules[base_class.__module__].__dict__
        for i, platform in enumerate(platforms):
            d = dict(base_class.__dict__)
            d['desired_capabilities'] = platform
            name = "%s_%s" % (base_class.__name__, i + 1)
            module[name] = type(name, (base_class,), d)
    return decorator


def get_port_available(port_nb):
    for available_port in range(port_nb, port_nb + 1000):
        with closing(socket(AF_INET, SOCK_STREAM)) as sock:
            if sock.connect_ex(("0.0.0.0", available_port)) == 0:
                continue
            else:
                return str(available_port)


#def setUpModule():
#    global p  # Could very likely be changed to avoid global variable
#    global port
#    port = get_port_available(7878)
#    p = psutil.Popen(["magrit", "--port", port], stdout=PIPE, stderr=PIPE)
#    time.sleep(5)
#
#
#def tearDownModule():
#    pass
#    p.send_signal(SIGINT)
#    p.wait(5)
#    try:
#        p.kill()
#    except:
#        pass
port = 9999

@flaky
@on_platforms(browsers, RUN_LOCAL)
class MainFunctionnalitiesTest(unittest.TestCase):
    """
    Runs a test using travis-ci and saucelabs
    """

    def setUp(self):
        if RUN_LOCAL:
            self.setUpLocal()
        elif RUN_DOCKER:
            self.setUpDocker()

    def tearDown(self):
        if RUN_LOCAL:
            self.tearDownLocal()

    def setUpDocker(self):
        self.driver = webdriver.Remote(
            desired_capabilities=self.desired_capabilities,
            command_executor="http://localhost:4444/wd/hub")
        self.driver.implicitly_wait(10)
        self.base_url = "http://localhost:{}/modules".format(port)
        self.verificationErrors = []
        self.accept_next_alert = True

    def setUpLocal(self):
        self.tmp_folder = "/tmp/export_selenium_test_{}/".format(str(uuid4()).split('-')[4])
        os.mkdir(self.tmp_folder)
        chromeOptions = webdriver.ChromeOptions()
        chromeOptions.add_experimental_option(
            "prefs", {"download.default_directory" : self.tmp_folder})
        self.driver = webdriver.Chrome(executable_path='/home/mz/chromedriver', chrome_options=chromeOptions)
        #self.driver = webdriver.Firefox()
        self.driver.set_window_size(1600, 900)
        self.driver.implicitly_wait(5)
        self.base_url = "http://localhost:{}/modules".format(port)
        self.verificationErrors = []
        self.accept_next_alert = True

    def tearDownLocal(self):
        self.assertEqual([], self.verificationErrors)
        self.driver.quit()

    def test_languages(self):
        menu_desc = {"fr": ["Import des données", "Choix de la représentation"],
                     "en": ["Add your data", "Choose a representation"]}
        driver = self.driver
        driver.get(self.base_url)
        button_lang = driver.find_element_by_css_selector("#current_app_lang")
        current_lang = button_lang.text
        menu1 = driver.find_element_by_css_selector("#btn_s1")
        menu2 = driver.find_element_by_css_selector("#btn_s2")
        self.assertEqual(menu1.text, menu_desc[current_lang][0])
        self.assertEqual(menu2.text, menu_desc[current_lang][1])

        button_lang.click()
        driver.find_element_by_css_selector("#menu_lang").find_element_by_xpath("//li[@data-index='1']").click()
        new_lang = driver.find_element_by_css_selector("#current_app_lang").text
        self.assertNotEqual(current_lang, new_lang)

        menu1 = driver.find_element_by_css_selector("#btn_s1")
        menu2 = driver.find_element_by_css_selector("#btn_s2")
        self.assertEqual(menu1.text, menu_desc[new_lang][0])
        self.assertEqual(menu2.text, menu_desc[new_lang][1])

    def test_layout_features(self):
        driver = self.driver
        driver.get("http://localhost:9999/modules")
        self.open_menu_section(4)

        driver.find_element_by_id('btn_text_annot').click()
        time.sleep(0.2)
        elem = driver.find_element_by_id("in_text_annotation_0")
        self.assertEqual(elem.is_displayed(), True)
        action = webdriver.ActionChains(driver)
        action.context_click(on_element=elem)
        action.perform()
        time.sleep(0.2)

        driver.find_element_by_id('btn_scale').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "scale_bar"):
            self.fail("Scale bar won't display")

        driver.find_element_by_id('btn_graticule').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "Graticule"):
            self.fail("Graticule won't display")

        driver.find_element_by_id('btn_sphere').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "Sphere"):
            self.fail("Sphere background won't display")

        driver.find_element_by_id('btn_north').click()
        time.sleep(0.2)
        if not self.try_element_present(By.ID, "north_arrow"):
            self.fail("North arrow won't display")

    def test_links(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")

        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        Select(driver.find_element_by_css_selector("select.sample_dataset")
            ).select_by_value("twincities")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal("button.swal2-cancel.swal2-styled")

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_flow")

        Select(driver.find_element_by_id("FlowMap_field_i")
            ).select_by_visible_text("i")
        Select(driver.find_element_by_id("FlowMap_field_j")
            ).select_by_visible_text("j")
        Select(driver.find_element_by_id("FlowMap_field_fij")
            ).select_by_visible_text("fij")

        driver.find_element_by_id("FlowMap_yes").click()
        self.waitClickButtonSwal()
        if not self.try_element_present(By.ID, "legend_root_links", 5):
            self.fail("Legend not displayed on links map")

    def test_gridded(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_grid")

        Select(driver.find_element_by_id("Gridded_field")).select_by_visible_text("birth_2008")
        driver.find_element_by_id("Gridded_cellsize").clear()
        driver.find_element_by_id("Gridded_cellsize").send_keys("145")
        Select(driver.find_element_by_id("Gridded_shape")).select_by_value("Diamond")
        driver.find_element_by_id("Gridded_yes").click()

        self.waitClickButtonSwal()

        if not self.try_element_present(By.ID, "legend_root", 5):
            self.fail("Legend not displayed on grid map")

    def test_generate_labels(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.nuts2_data > div > .style_target_layer"))
        time.sleep(0.5)
        self.clickWaitTransition("#generate_labels")
        Select(driver.find_element_by_css_selector("select.swal2-select")
            ).select_by_value("id")
        self.waitClickButtonSwal()
        time.sleep(1)
        self.click_element_with_retry(".btn_ok")
        time.sleep(0.5)
        labels = driver.find_element_by_id(
            "Labels_id_nuts2_data"
            ).find_elements_by_css_selector("text")
        self.assertIsInstance(labels, list)
        self.assertGreater(len(labels), 0)

    # def test_change_projection(self):
    #     driver = self.driver
    #     driver.get(self.base_url)
    #     self.clickWaitTransition("#sample_link")
    #     Select(driver.find_element_by_css_selector("select.sample_target")
    #         ).select_by_value("nuts2_data")
    #     driver.find_element_by_css_selector(".btn_ok").click()
    #     self.waitClickButtonSwal()

    @unittest.skipIf(RUN_LOCAL is not True, 'Skip download test')
    def test_downloads(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        # Open the appropriate menu:
        self.open_menu_section(5)

        # Test export to svg:
        Select(driver.find_element_by_id("select_export_type")
            ).select_by_value("svg")
        time.sleep(0.2)
        driver.find_element_by_id("export_button_section5b").click()
        time.sleep(1)
        with open(self.tmp_folder + "export.svg", "r") as f:
            svg_data = f.read()
        self.assertIn('<svg', svg_data)
        self.assertIn('nuts2_data', svg_data)
        os.remove(self.tmp_folder + "export.svg")

        # Open the appropriate menu:
        Select(driver.find_element_by_id("select_export_type")
            ).select_by_value("png")
        time.sleep(0.2)
        driver.find_element_by_id("export_button_section5b").click()
        time.sleep(1)
        with open(self.tmp_folder + "export.png", "rb") as f:
            png_data = f.read()
        self.assertGreater(len(png_data), 0)
        time.sleep(0.1)
        os.remove(self.tmp_folder + "export.png")

        # Test export to geographic layer (from the source layer):
        Select(driver.find_element_by_id("select_export_type")
            ).select_by_value("geo")
        time.sleep(0.2)
        driver.find_element_by_id("export_button_section5b").click()
        time.sleep(0.5)
        Select(driver.find_element_by_id("layer_to_export")
            ).select_by_visible_text("nuts2_data")
        Select(driver.find_element_by_id("datatype_to_use")
            ).select_by_value("GeoJSON")
        Select(driver.find_element_by_id("projection_to_use")
            ).select_by_value("epsg:4326")

        driver.find_element_by_css_selector(".dialogGeoExport"
            ).find_element_by_css_selector("button.btn_ok").click()
        time.sleep(2)
        with open(self.tmp_folder + "nuts2_data.geojson", "r") as f:
            raw_geojson = f.read()
        parsed_geojson = json.loads(raw_geojson)
        self.assertIn("features", parsed_geojson)
        self.assertIn("type", parsed_geojson)
#        self.assertIn("crs", parsed_geojson)
        self.assertEqual(len(parsed_geojson["features"]), 310)
        os.remove(self.tmp_folder + "nuts2_data.geojson")

        # # Test export on result layer this time
        # # First coompute a result from smoothed map functionnality :
        # driver.find_element_by_id("btn_s2").click()
        # time.sleep(0.5)
        # driver.find_element_by_css_selector("#button_smooth").click()
        # time.sleep(0.2)
        # driver.find_element_by_id("stewart_nb_class").clear()
        # driver.find_element_by_id("stewart_nb_class").send_keys("7")
        # driver.find_element_by_id("stewart_span").clear()
        # driver.find_element_by_id("stewart_span").send_keys("60")
        # Select(driver.find_element_by_id("stewart_mask")
        #     ).select_by_visible_text("nuts2_data")
        # # Set a custom name for this result layer :
        # driver.find_element_by_id("stewart_output_name").clear()
        # driver.find_element_by_id("stewart_output_name").send_keys("NewLayerName")
        # driver.find_element_by_id("stewart_yes").click()
        # button_ok = self.get_button_ok_displayed()
        # button_ok.click()
        # time.sleep(1)  # Delay for the sweet alert to close
        #
        # # Open the appropriate menu:
        # menu_options = self.get_menu_options()
        #
        # # Test export to geographic layer (from a result layer):
        # menu_options[4].click()
        # time.sleep(0.2)
        # Select(driver.find_element_by_id("layer_to_export")
        #     ).select_by_visible_text("NewLayerName")
        # Select(driver.find_element_by_id("datatype_to_use")
        #     ).select_by_value("GeoJSON")
        # Select(driver.find_element_by_id("projection_to_use")
        #     ).select_by_value("epsg:4326")
        #
        # driver.find_element_by_id("dialogGeoExport"
        #     ).find_element_by_css_selector("button.button_st4").click()
        # time.sleep(0.5)
        # with open(self.tmp_folder + "NewLayerName.geojson", "r") as f:
        #     raw_geojson = f.read()
        # parsed_geojson = json.loads(raw_geojson)
        # self.assertIn("features", parsed_geojson)
        # self.assertIn("type", parsed_geojson)
        # self.assertIn("crs", parsed_geojson)
        # os.remove(self.tmp_folder + "NewLayerName.geojson")

    def test_Typo(self):
        driver = self.driver
        driver.get(self.base_url)
        time.sleep(0.2)
        self.clickWaitTransition("#sample_link")

        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        driver.find_element_by_css_selector("li.nuts2_data"
            ).find_elements_by_css_selector("#browse_data_button")[0].click()
        time.sleep(1)

        # Test adding fields to the existing table :
        self.clickWaitTransition("#add_field_button")
        Select(driver.find_element_by_id("type_content_select")
            ).select_by_value("string_field")
        time.sleep(0.3)
        driver.find_element_by_css_selector("input[value=\"NewFieldName\"]").clear()
        driver.find_element_by_css_selector(
            "input[value=\"NewFieldName\"]").send_keys("Pays")

        # One categorical field (country) obtained by truncating ids of nuts2 features :
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("id")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_value("truncate")
        driver.find_element_by_id("val_opt").clear()
        driver.find_element_by_id("val_opt").send_keys("2")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)
        self.click_elem_retry(
            driver.find_element_by_id(
                "browse_data_box").find_elements_by_css_selector(
                ".btn_ok")[0])
        time.sleep(0.5)
        self.open_menu_section(2)
        self.clickWaitTransition("#button_typo")
        Select(driver.find_element_by_id("Typo_field_1")
            ).select_by_value("Pays")
        time.sleep(0.1)
        self.click_element_with_retry("#Typo_class")

        # Confirm the fact that there is a lot of features for this kind of representation :
        self.waitClickButtonSwal()

        # Valid with the random colors selected for each category :
        self.click_element_with_retry(".btn_ok")
        driver.find_element_by_id("Typo_yes").click()

    def test_stewart(self):
        driver = self.driver
        driver.get(self.base_url)
        time.sleep(0.2)
        self.clickWaitTransition("#sample_link")

        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts3_data")
        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts2_data")
        driver.find_element_by_css_selector(".btn_ok").click()

        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_smooth")

        driver.find_element_by_id("stewart_nb_class").clear()
        driver.find_element_by_id("stewart_nb_class").send_keys("7")
        driver.find_element_by_id("stewart_span").clear()
        driver.find_element_by_id("stewart_span").send_keys("60")
        Select(driver.find_element_by_id("stewart_mask")
            ).select_by_visible_text("nuts2_data")
        driver.find_element_by_id("stewart_yes").click()
        self.waitClickButtonSwal()
        if not self.try_element_present(By.ID, "legend_root", 5):
            self.fail("Legend not displayed on stewart")

    def test_cartogram_new_field(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(driver.find_element_by_css_selector("select.sample_target")
            ).select_by_value("nuts3_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        driver.find_element_by_css_selector("li.nuts3_data"
            ).find_elements_by_css_selector("#browse_data_button")[0].click()
        time.sleep(1)

        # Test adding fields to the existing table :
        self.clickWaitTransition("#add_field_button")

        driver.find_element_by_css_selector("input[value=\"NewFieldName\"]").clear()
        driver.find_element_by_css_selector(
            "input[value=\"NewFieldName\"]").send_keys("NewFieldName3")

        # One field based on an operation betweeen two numerical variables :
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("gdppps1999")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[3]")).select_by_visible_text("gdppps2008")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_visible_text("/")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)

        self.clickWaitTransition("#add_field_button")
        driver.find_element_by_css_selector("input[value=\"NewFieldName\"]").clear()
        driver.find_element_by_css_selector("input[value=\"NewFieldName\"]").send_keys("NewFieldName2")

        # One field based on an operation betweeen a numerical variable and a constant :
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("gdppps2008")
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("birth_2008")
        Select(driver.find_element_by_css_selector(
            "#field_div1 > select")).select_by_visible_text("gdppps2008")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_visible_text("/")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[3]")).select_by_value("user_const_value")
        driver.find_element_by_id("val_opt").clear()
        driver.find_element_by_id("val_opt").send_keys("1000")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_visible_text("*")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)

        self.clickWaitTransition("#add_field_button")
        driver.find_element_by_css_selector("input[value=\"NewFieldName\"]").clear()
        driver.find_element_by_css_selector("input[value=\"NewFieldName\"]").send_keys("NewFieldName1")

        # One field based on an operation on a char string field
        Select(driver.find_element_by_id(
            "type_content_select")).select_by_value("string_field")
        Select(driver.find_element_by_xpath(
            "//div[@id='field_div1']/select[2]")).select_by_value("truncate")
        driver.find_element_by_id("val_opt").clear()
        driver.find_element_by_id("val_opt").send_keys("2")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        time.sleep(0.4)
        self.click_elem_retry(
            driver.find_element_by_id(
                "browse_data_box").find_elements_by_css_selector(
                ".btn_ok")[0])
        time.sleep(0.4)

        self.open_menu_section(2)
        #  Test the dougenik cartogram functionnality...
        self.clickWaitTransition("#button_cartogram")

        Select(driver.find_element_by_css_selector(
            "select.params")).select_by_visible_text("Dougenik & al. (1985)")

        #  ... using one of these previously computed field :
        Select(driver.find_element_by_id(
            "Anamorph_field")).select_by_visible_text("NewFieldName2")
        driver.find_element_by_id("Anamorph_yes").click()
        button_ok = self.get_button_ok_displayed()
        button_ok.click()

    def test_new_field_choro_many_features(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")

        Select(driver.find_element_by_css_selector("select.sample_target")
                ).select_by_value("us_county")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal()
        time.sleep(0.3)

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(3)
        self.click_elem_retry(
            driver.find_element_by_css_selector(
                "li.us_county").find_element_by_css_selector(
                "#browse_data_button"))
        time.sleep(0.5)

        self.clickWaitTransition("#add_field_button")
        #  Computing a new field on a layer with more than 3100 features
        #  ... will delegate the operation to the server :
        Select(driver.find_element_by_css_selector("#field_div1 > select")
                ).select_by_visible_text("AWATER")
        Select(driver.find_element_by_xpath("//div[@id='field_div1']/select[2]")
                ).select_by_visible_text("/")
        Select(driver.find_element_by_xpath("//div[@id='field_div1']/select[3]")
                ).select_by_visible_text("ALAND")
        driver.find_element_by_css_selector(
            "input[value=\"NewFieldName\"]").clear()
        driver.find_element_by_css_selector(
            "input[value=\"NewFieldName\"]").send_keys("Ratio")
        driver.find_element_by_css_selector(
            ".addFieldBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        self.click_elem_retry(
            driver.find_element_by_id(
                "browse_data_box").find_elements_by_css_selector(
                ".btn_ok")[0])

        self.open_menu_section(2)
        self.clickWaitTransition("#button_choro")
        #  Let's use this new field to render a choropleth map :
        Select(driver.find_element_by_id("choro_field_1")
                ).select_by_visible_text("Ratio")
        driver.find_element_by_css_selector("option[value=\"Ratio\"]").click()
        driver.find_element_by_id("choro_class").click()
        self.click_elem_retry(
            driver.find_element_by_id(
                "discretiz_charts").find_elements_by_css_selector(
                ".btn_ok")[0])
        driver.find_element_by_id("choro_yes").click()
        time.sleep(1)  # Little delay for the map to be rendered

        if not self.try_element_present(By.ID, "legend_root", 5):
            self.fail("Legend not displayed on choropleth")

    def test_discont_joined_field(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")
        Select(driver.find_element_by_css_selector("select.sample_target")
                ).select_by_value("martinique")
        Select(driver.find_element_by_css_selector("select.sample_dataset")
                ).select_by_value("martinique_data")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal()

        driver.find_element_by_css_selector(
            ".joinBox").find_elements_by_css_selector(
            ".btn_ok")[0].click()
        # Now the alert about how it was successful :
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_discont")

        Select(driver.find_element_by_id("field_Discont")
                ).select_by_visible_text("P13_POP")
        Select(driver.find_element_by_id("Discont_discKind")
                ).select_by_visible_text("Quantiles")
        driver.find_element_by_id("Discont_nbClass").clear()
        driver.find_element_by_id("Discont_nbClass").send_keys("6")
        if not self.is_element_present(By.ID, "color_Discont"):
            self.fail("Missing features in the interface")
        driver.execute_script(
            "document.getElementById('color_Discont').value = '#da2929';")
        driver.find_element_by_id("yes_Discont").click()
        time.sleep(1)  # Delay for the discontinuities to be computed
        driver.find_element_by_id("legend_button").click()
        if not self.try_element_present(By.ID, "legend_root_links", 5):
            self.fail("Legend won't display")

    def test_propSymbols(self):
        driver = self.driver
        driver.get(self.base_url)
        self.clickWaitTransition("#sample_link")

        Select(driver.find_element_by_css_selector("select.sample_target")
                ).select_by_value("GrandParisMunicipalities")
        driver.find_element_by_css_selector(".btn_ok").click()
        self.waitClickButtonSwal()

        # Valid the type of each field :
        self.validTypefield()

        self.open_menu_section(2)
        self.clickWaitTransition("#button_prop")

        Select(driver.find_element_by_id(
            "PropSymbol_field_1")).select_by_visible_text("TH")
        Select(driver.find_element_by_id(
            "PropSymbol_symbol")).select_by_value("rect")
        Select(driver.find_element_by_id("PropSymbol_nb_colors")
                ).select_by_value("2")
        driver.find_element_by_id("PropSymbol_break_val").clear()
        driver.find_element_by_id("PropSymbol_break_val").send_keys("14553")

        if not self.is_element_present(By.ID, "PropSymbol_color1") \
                or not self.is_element_present(By.ID, "PropSymbol_color2"):
            self.fail("Missing features in the interface")

        driver.execute_script(
            "document.getElementById('PropSymbol_color1').value = '#e3a5f3';")
        driver.execute_script(
            "document.getElementById('PropSymbol_color1').value = '#ffff00';")
        driver.find_element_by_id("PropSymbol_yes").click()
        time.sleep(1.5)
        if not self.try_element_present(By.ID, "legend_root2", 5):
            self.fail("Legend won't display")
        time.sleep(0.1)

        self.clickWaitTransition("#legend_button")
        if not self.try_element_present(By.ID, "legend_root2", 5):
            self.fail("Legend won't hide")

        # driver.find_element_by_css_selector(
        #     "img.style_target_layer").click()
        # driver.find_element_by_css_selector(
        #     "#fill_color_section > input[type=\"number\"]").clear()
        # driver.find_element_by_css_selector(
        #     "#fill_color_section > input[type=\"number\"]").send_keys("100000")
        # driver.find_element_by_xpath("(//input[@value='145535'])[2]").clear()
        # driver.find_element_by_xpath("(//input[@value='145535'])[2]").send_keys("15535")
        # driver.find_element_by_css_selector(
        #     ".styleBox").find_elements_by_css_selector(
        #     ".btn_ok")[0].click()
        # driver.find_element_by_id("legend_button").click()

    # def test_propSymbolsChoro(self):
    #     # TODO
    #     pass

    def validTypefield(self):
        self.click_elem_retry(
            self.driver.find_element_by_id(
                "box_type_fields").find_elements_by_css_selector(
                ".btn_ok")[0])
        time.sleep(0.5)

    def changeTypefield(self):
        pass

    def deeper_test_legend(self, id_legend, type_elem):
        legend_root = self.driver.find_element_by_id(id_legend)
        inner_groups = legend_root.find_elements_by_css_selector(".lg")
        self.assertIsInstance(inner_groups, list)
        self.assertGreater(len(inner_groups), 0)
        # Todo : check that right click and dblclick are working too

    def open_menu_section(self, nb_section):
        b = self.driver.find_element_by_id("btn_s{}".format(nb_section))
        if b:
            self.click_elem_retry(b)
            time.sleep(0.5)
        else:
            self.fail("Failed to open menu ", nb_section)

    def clickWaitTransition(self, css_selector, delay=0.5):
        self.driver.find_element_by_css_selector(css_selector).click()
        time.sleep(delay)

    @retry(Exception, 3, 1)
    def click_element_with_retry(self, selector):
        self.driver.find_element_by_css_selector(selector).click()

    @retry(Exception, 3, 1)
    def click_elem_retry(self, elem):
        elem.click()

    def get_button_ok_displayed(self, selector="button.swal2-confirm.swal2-styled", delay=30):
        if not self.try_element_present(By.CSS_SELECTOR, selector, delay):
            self.fail("Time out")
        else:
            button_ok = self.driver.find_element_by_css_selector(selector)
            for i in range(delay):
                if not button_ok.is_displayed():
                    time.sleep(1)
                else:
                    return button_ok
            self.fail("Time out")

    def waitClickButtonSwal(self, selector="button.swal2-confirm.swal2-styled", delay=30):
        button_ok = self.get_button_ok_displayed(selector, delay)
        button_ok.click()
        time.sleep(0.5)

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

    def try_element_present(self, how, what, delay=60):
        for i in range(delay):
            try:
                if self.is_element_present(how, what):
                    return True
            except:
                pass
            time.sleep(1)
        return False

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


if __name__ == "__main__":
    unittest.main()
