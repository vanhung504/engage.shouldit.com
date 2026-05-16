import { Hr, Link, Section, Text } from 'react-email'

type FooterProps = {
  unsubscribeUrl: string
}

export function Footer({ unsubscribeUrl }: FooterProps) {
  return (
    <Section style={{ padding: '24px 0' }}>
      <Hr style={{ borderColor: '#e5e7eb', margin: '0 0 16px' }} />
      <Text style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
        We buy everything we test. No advertising. No sponsored content.
      </Text>
      <Text style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
        <Link href={unsubscribeUrl} style={{ color: '#6b7280' }}>
          Unsubscribe
        </Link>
        {' · shouldit.com'}
      </Text>
    </Section>
  )
}
