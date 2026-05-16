import { Body, Container, Head, Html, Link, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function Reengagement({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>We'd rather you unsubscribe than ignore us.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              Still useful?
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              You haven't opened a shouldit email in a while. That's fine — but we'd rather know
              than keep sending into the void.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              If you're still interested in honest product research, no action needed. We'll keep
              sending when we have something worth reading.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              If not, <Link href={unsubscribeUrl} style={{ color: '#111', fontWeight: '600' }}>unsubscribe here</Link>.
              No hard feelings — we mean that.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
