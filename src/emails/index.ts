import type React from 'react'
import BlendersBuyingD0   from './sequences/blenders/buying-d0'
import BlendersBuyingD2   from './sequences/blenders/buying-d2'
import BlendersBuyingD4   from './sequences/blenders/buying-d4'
import BlendersBuyingD7   from './sequences/blenders/buying-d7'
import BlendersResearchD0 from './sequences/blenders/research-d0'
import BlendersResearchD2 from './sequences/blenders/research-d2'
import BlendersResearchD4 from './sequences/blenders/research-d4'
import BlendersResearchD7 from './sequences/blenders/research-d7'
import DealD0             from './sequences/deal/d0'
import DealD3             from './sequences/deal/d3'
import PowerUserD0        from './sequences/power-user/d0'
import PowerUserD2        from './sequences/power-user/d2'
import PowerUserD5        from './sequences/power-user/d5'
import CrosssellSurvey    from './sequences/shared/crosssell-survey'
import Reengagement       from './sequences/shared/reengagement'

export type EmailProps = {
  unsubscribeUrl: string
  vars: Record<string, string>
}

export const templates: Record<string, React.ComponentType<EmailProps>> = {
  'blenders-buying-d0':    BlendersBuyingD0,
  'blenders-buying-d2':    BlendersBuyingD2,
  'blenders-buying-d4':    BlendersBuyingD4,
  'blenders-buying-d7':    BlendersBuyingD7,
  'blenders-research-d0':  BlendersResearchD0,
  'blenders-research-d2':  BlendersResearchD2,
  'blenders-research-d4':  BlendersResearchD4,
  'blenders-research-d7':  BlendersResearchD7,
  'deal-d0':               DealD0,
  'deal-d3':               DealD3,
  'power-d0':              PowerUserD0,
  'power-d2':              PowerUserD2,
  'power-d5':              PowerUserD5,
  'crosssell-survey':      CrosssellSurvey,
  'reengagement':          Reengagement,
}
