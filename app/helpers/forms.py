# -*- coding: utf-8 -*-
"""
@author: mz
"""
from wtforms import Form, TextAreaField, validators

class RstatementForm(Form):
    rcommande = TextAreaField('R commande',
                          [validators.Length(min=1, max=4000),
                           validators.DataRequired(True)],
                          default=u'R.Version()')
