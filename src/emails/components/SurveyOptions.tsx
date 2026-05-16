import { Button, Section } from 'react-email'

type SurveyOption = {
  label:     string
  value:     string
  surveyUrl: string
}

type SurveyOptionsProps = {
  options: SurveyOption[]
}

export function SurveyOptions({ options }: SurveyOptionsProps) {
  return (
    <Section style={{ padding: '16px 0' }}>
      {options.map(opt => (
        <Button
          key={opt.value}
          href={opt.surveyUrl}
          style={{
            display:       'block',
            background:    '#f3f4f6',
            color:         '#111',
            padding:       '12px 20px',
            borderRadius:  '6px',
            fontSize:      '14px',
            fontWeight:    '500',
            textDecoration: 'none',
            marginBottom:  '8px',
            textAlign:     'center',
          }}
        >
          {opt.label}
        </Button>
      ))}
    </Section>
  )
}
