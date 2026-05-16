import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersResearchD0({ unsubscribeUrl }: Props) {
  const scores = [
    { name: 'NutriBullet Full-Size', score: '92' },
    { name: 'Vitamix E310',          score: '89' },
    { name: 'Ninja BL610',           score: '81' },
    { name: 'Oster Pro 1200',        score: '74' },
  ]

  return (
    <Html><Head />
      <Preview>Full scores — smoothie, frozen fruit, noise, cleanup.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              How the NutriBullet scored vs 44 other blenders
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              We ran every blender through the same four tests: smoothie consistency, frozen fruit,
              noise (in dB), and cleanup time. Here are the top results:
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
            {scores.map(({ name, score }) => (
              <Text key={name} style={{ fontSize: '14px', color: '#111', margin: '0 0 8px', display: 'flex', justifyContent: 'space-between' }}>
                {name} <span style={{ color: '#6b7280' }}>— {score}/100</span>
              </Text>
            ))}
            <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>
              Full 45-model scoreboard available to Pro members.
            </Text>
          </Section>
          <Section>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              Next: the three things our testing consistently debunked about blenders.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
