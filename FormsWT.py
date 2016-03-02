# -*- coding: utf-8 -*-
"""
@author: mz
"""
from wtforms import (
    FileField, IntegerField, SelectField, FieldList,
    Form, TextAreaField, validators, StringField, FloatField,
    RadioField, FormField)
from data_examples import json_example, json_example2, geojson_example


class RstatementForm(Form):
    rcommande = TextAreaField('R commande',
                          [validators.Length(min=1, max=4000),
                           validators.DataRequired(True)],
                          default=u'R.Version()')


class SpatialPos_Form(Form):
    point_layer = FileField('Observation point layer')
                            #,[FileAllowed(['geojson', 'topojson'], 'JSON Geoms only!')])
    mask_layer = FileField('Mask (contour) layer')
    #, [FileAllowed(['geojson', 'topojson'], 'JSON Geoms only!')])
    var_name = StringField('Variable name')
    span = IntegerField('Span (meter)',  [validators.NumberRange(min=0, max=100000)])
    beta = IntegerField('Beta', [validators.NumberRange(min=0, max=5)])
    type_fun = RadioField(choices=[('exponential', 'Exponential'), ('pareto', 'Pareto')])
    resolution = IntegerField('Resolution (meter)',  [validators.NumberRange(min=0, max=100000)])


class MTA_form_global(Form):
    json_df = TextAreaField('The jsonified data.frame', default=json_example)
    var1 = StringField('First variable name', [validators.Required()])
    var2 = StringField('Second variable name', [validators.Required()])
    ref = FloatField('The reference ratio (optionnal)', [validators.Optional()])
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')],
                          validators=[validators.Required()], default='rel')


class MTA_form_medium(Form):
    json_df = TextAreaField('The jsonified data.frame',
                            validators=[validators.Required()],
                            default=json_example2)
    var1 = StringField('First variable name', [validators.Required()])
    var2 = StringField('Second variable name', [validators.Required()])
    key = StringField('Name of the column containg the aggregation key',
                      [validators.Required()])
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')],
                          default='rel',
                          validators=[validators.Required()])


class MTA_form_local(Form):
    geojs = TextAreaField('GeoJSON layer with data attributes',
                          validators=[validators.Required()],
                          default=geojson_example)
    var1 = StringField('First variable name', [validators.Required()])
    var2 = StringField('Second variable name', [validators.Required()])
    order = FloatField('Contiguity order (optionnal)', [validators.Optional()])
    distance = FloatField('The distance defining the contiguity (optionnal)', [validators.Optional()])
    type_fun = RadioField(choices=[('rel', 'Relative'), ('abs', 'Absolute')],
                          default='rel', validators=[validators.Required()])

class FlowsAnalysisForm(Form):
#    colname = SelectField('Column names....')
    field_i = SelectField('Flows origins (i) :', choices=[])
    field_j = SelectField('Flows destinations (i) :', choices=[])
    field_fij = SelectField('Flow intensity (Fij) :', choices=[])

    
class FlowsForm(Form):
    table = FileField('.csv or .xls table')
    next_field = FieldList(FormField(FlowsAnalysisForm),
                           'Columns to use for later analysis')
