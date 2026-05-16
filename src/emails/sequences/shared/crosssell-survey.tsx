import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { SurveyOptions } from '../../components/SurveyOptions'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function CrosssellSurvey({ unsubscribeUrl, vars }: Props) {
  const productName = vars.product_name ?? vars.product_id ?? 'your purchase'
  const sid = vars.sid ?? ''
  const base = 'https://engage.shouldit.com/api/survey'

  const options = [
    { label: 'Coffee makers',  value: 'coffee-makers',  surveyUrl: `${base}?sid=${sid}&answer=coffee-makers` },
    { label: 'Air fryers',     value: 'air-fryers',     surveyUrl: `${base}?sid=${sid}&answer=air-fryers` },
    { label: 'Water filters',  value: 'water-filters',  surveyUrl: `${base}?sid=${sid}&answer=water-filters` },
    { label: 'Something else', value: 'other',          surveyUrl: `${base}?sid=${sid}&answer=other` },
  ]

  return (
    <Html><Head />
      <Preview>One question. Takes 5 seconds.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              How's {productName} working out?
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              We hope it's everything you expected. One question while we have you — what are you
              researching next?
            </Text>
          </Section>
          <SurveyOptions options={options} />
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
