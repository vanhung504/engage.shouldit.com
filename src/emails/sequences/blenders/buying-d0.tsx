import { Body, Button, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

const body:    React.CSSProperties = { backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }
const wrap:    React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '0 24px' }
const p:       React.CSSProperties = { fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }
const label:   React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }
const tip:     React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#374151', backgroundColor: '#f9fafb', borderRadius: '6px', padding: '12px 16px', margin: '0 0 20px' }
const sign:    React.CSSProperties = { fontSize: '15px', color: '#6b7280', margin: '24px 0 0' }

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersBuyingD0({ unsubscribeUrl, vars }: Props) {
  const slug           = vars.product_id      ?? 'nutribullet-znbf30500z'
  const name           = vars.product_name   ?? 'NutriBullet Full-Size Blender'
  const score          = vars.score           ?? '9.1'
  const verdict        = vars.product_verdict ?? 'Strongest performer per dollar we tested. Smoothie, frozen fruit, protein shake — clean results across the board. Easy cleanup, solid build.'
  const price          = vars.price           ?? '$124'
  const valueStatement = vars.value_statement ?? 'The one we\'d put in our own kitchen.'
  const testTip        = vars.test_tip        ?? 'Lid can feel loose at first — push firmly until you hear a click.'
  const reviewUrl      = vars.review_url      ?? `https://shouldit.com/review/${slug}/?ref=email`

  return (
    <Html>
      <Head />
      <Preview>We tested it against 44 others. Here's the short version.</Preview>
      <Body style={body}>
        <Container style={wrap}>
          <Header />

          <Section>
            <Text style={p}>
              <strong>{name}</strong> scored <strong>{score}/10</strong> across our full test
              suite — smoothie, frozen fruit, almond butter, protein shake, crushed ice.
            </Text>

            <Text style={{ ...p, margin: '0 0 8px' }}>Here's what the tests showed:</Text>
            <Text style={{ ...p, margin: '0 0 20px' }}>{verdict}</Text>

            <Text style={p}>
              At {price}, {valueStatement.charAt(0).toLowerCase() + valueStatement.slice(1)}
            </Text>

            <Text style={label}>One thing to know before you buy</Text>
            <Text style={tip}>{testTip}</Text>

            <Text style={p}>We'll let you know if the price drops.</Text>
          </Section>

          <Section style={{ margin: '8px 0 0' }}>
            <Button
              href={reviewUrl}
              style={{
                background:     '#111',
                color:          '#fff',
                padding:        '12px 24px',
                borderRadius:   '6px',
                fontSize:       '14px',
                fontWeight:     '600',
                textDecoration: 'none',
                display:        'inline-block',
              }}
            >
              See full test results →
            </Button>
          </Section>

          <Text style={sign}>— The shouldit team</Text>

          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
