import { Box, Button, Checkbox, FormControl, FormControlLabel, MenuItem, Typography } from '@material-ui/core'
import { Field, Form, Formik } from 'formik'
import React, { useEffect, useRef, useState } from 'react'
import { useStoreDispatch, useStoreSelector } from 'store'

import { RBACConfigParams } from 'api/common.type'
import { SelectField } from 'components/FormField'
import Space from 'components-mui/Space'
import T from 'components/T'
import api from 'api'
import copy from 'copy-text-to-clipboard'
import { makeStyles } from '@material-ui/core/styles'
import { setAlert } from 'slices/globalStatus'
import { toTitleCase } from 'lib/utils'
import { useIntl } from 'react-intl'

const useStyles = makeStyles((theme) => ({
  pre: {
    padding: theme.spacing(3),
    background: theme.palette.background.default,
    borderRadius: 4,
    whiteSpace: 'pre-wrap',
  },
  copy: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
  },
}))

const RBACGenerator = () => {
  const classes = useStyles()

  const intl = useIntl()

  const { namespaces } = useStoreSelector((state) => state.experiments)
  const dispatch = useStoreDispatch()

  const [clustered, setClustered] = useState(false)
  const [rbac, setRBAC] = useState('')
  const [getSecret, setGetSecret] = useState('')

  const containerRef = useRef(null)

  const fetchRBACConfig = (values: RBACConfigParams) =>
    api.common.rbacConfig(values).then(({ data }) => {
      const entries = Object.entries<string>(data)
      const [name, yaml] = entries[0]

      setRBAC(yaml)
      setGetSecret(`kubectl describe${name.includes('cluster') ? '' : ` -n ${values.namespace}`} secrets ${name}`)
    })

  useEffect(() => {
    fetchRBACConfig({ namespace: 'default', role: 'viewer' })
  }, [])

  const onValidate = ({ namespace, role, clustered }: RBACConfigParams & { clustered: boolean }) => {
    fetchRBACConfig({
      namespace: clustered ? '' : namespace,
      role,
    })
    setClustered(clustered)
  }

  const copyRBAC = () => {
    copy(rbac, { target: containerRef.current! })

    dispatch(
      setAlert({
        type: 'success',
        message: intl.formatMessage({ id: 'common.copied' }),
      })
    )
  }

  return (
    <div ref={containerRef}>
      <Box mb={3}>
        <Typography variant="body2" color="textSecondary">
          {T('settings.addToken.generatorHelper')}
        </Typography>
      </Box>
      <Formik
        initialValues={{ namespace: 'default', role: 'viewer', clustered: false }}
        onSubmit={() => {}}
        validate={onValidate}
        validateOnBlur={false}
      >
        <Form>
          <Box mb={3}>
            <FormControl>
              <FormControlLabel
                control={<Field as={Checkbox} name="clustered" color="primary" />}
                label={<Typography variant="body2">{T('settings.addToken.clustered')}</Typography>}
              />
            </FormControl>
          </Box>
          <Space mb={3}>
            <Box flex={1}>
              <SelectField
                name="namespace"
                label={T('k8s.namespace')}
                helperText={T('common.chooseNamespace')}
                disabled={clustered}
              >
                {namespaces.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </SelectField>
            </Box>
            <Box flex={1}>
              <SelectField
                name="role"
                label={T('settings.addToken.role')}
                helperText={T('settings.addToken.roleHelper')}
              >
                {['manager', 'viewer'].map((role) => (
                  <MenuItem key={role} value={role}>
                    {toTitleCase(role)}
                  </MenuItem>
                ))}
              </SelectField>
            </Box>
          </Space>
        </Form>
      </Formik>
      <Typography variant="body2" color="textSecondary">
        {T('settings.addToken.generatorHelper2')}
      </Typography>
      <Box position="relative">
        <pre className={classes.pre} style={{ height: 250, overflow: 'auto' }}>
          {rbac}
        </pre>
        <Box className={classes.copy}>
          <Button onClick={copyRBAC}>{T('common.copy')}</Button>
        </Box>
      </Box>
      <Typography variant="body2" color="textSecondary">
        {T('settings.addToken.generatorHelper3')}
      </Typography>
      <pre className={classes.pre}>kubectl apply -f rbac.yaml</pre>
      <Typography variant="body2" color="textSecondary">
        {T('settings.addToken.generatorHelper4')}
      </Typography>
      <pre className={classes.pre}>{getSecret}</pre>
    </div>
  )
}

export default RBACGenerator
