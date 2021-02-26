#!/usr/bin/python

import pandas as pd

df = pd.read_excel('http://www.econ.yale.edu/~shiller/data/ie_data.xls', sheet_name='Data', skiprows=7, skipfooter=1, usecols=['Date', 'P', 'D', 'CPI'])
df['Date'] = pd.to_datetime(df['Date'].astype(str), format='%Y.%m', yearfirst=True)
df.set_index('Date', inplace=True)
df.to_csv('public/data.csv')
