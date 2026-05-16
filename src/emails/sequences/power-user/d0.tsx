import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

const rankings = [
  { rank: 1,  name: 'NutriBullet Full-Size',  overall: 92, smoothie: 94, frozen: 90, noise: 78, cleanup: 91 },
  { rank: 2,  name: 'Vitamix E310',           overall: 89, smoothie: 97, frozen: 96, noise: 88, cleanup: 73 },
  { rank: 3,  name: 'Ninja BL610',            overall: 81, smoothie: 83, frozen: 85, noise: 90, cleanup: 77 },
  { rank: 4,  name: 'Oster Pro 1200',         overall: 74, smoothie: 76, frozen: 72, noise: 82, cleanup: 68 },
  { rank: 5,  name: 'Hamilton Beach 58148A',  overall: 71, smoothie: 73, frozen: 69, noise: 79, cleanup: 72 },
]

export default function PowerUserD0({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>Every model, every test, every score.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              Full scoreboard — all 45 blenders ranked
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              Top 5 shown here. Full 45-model dataset available to Pro members.
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px 20px', marginBottom: '8px' }}>
            <Text style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', margin: '0 0 8px' }}>
              # · Name · Overall · Smoothie · Frozen · Noise · Cleanup
            </Text>
            {rankings.map(r => (
              <Text key={r.rank} style={{ fontSize: '13px', color: '#111', margin: '0 0 6px', fontFamily: 'monospace' }}>
                {r.rank}. {r.name} — {r.overall} ({r.smoothie}/{r.frozen}/{r.noise}/{r.cleanup})
              </Text>
            ))}
          </Section>
          <Section style={{ marginBottom: '24px' }}>
            <Text style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
              Scores: smoothie consistency / frozen fruit / noise (lower=better) / cleanup
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
