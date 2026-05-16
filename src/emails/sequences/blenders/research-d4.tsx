import { Body, Button, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersResearchD4({ unsubscribeUrl, vars }: Props) {
  const sid = vars.sid ?? ''
  const base = 'https://engage.shouldit.com/survey'

  const options = [
    { label: 'Daily smoothies',     url: `${base}?sid=${sid}&answer=smoothies` },
    { label: 'Nut butters & hummus', url: `${base}?sid=${sid}&answer=nut-butters` },
    { label: 'Family meals',        url: `${base}?sid=${sid}&answer=family` },
    { label: 'Budget matters most', url: `${base}?sid=${sid}&answer=budget` },
  ]

  return (
    <Html><Head />
      <Preview>We'll match you with the right model.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              Still deciding? Tell us how you blend.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              Different use cases change our recommendation. One question:
            </Text>
          </Section>
          <Section style={{ marginBottom: '24px' }}>
            {options.map(opt => (
              <Button
                key={opt.label}
                href={opt.url}
                style={{ display: 'block', background: '#f3f4f6', color: '#111', padding: '12px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', textDecoration: 'none', marginBottom: '8px', textAlign: 'center' }}
              >
                {opt.label}
              </Button>
            ))}
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
