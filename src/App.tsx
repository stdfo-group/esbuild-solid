import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'

// import MenuIcon from '@suid/icons-material/Menu'
import { BiMenu as MenuIcon } from 'solid-icons/bi'
import AppBar from '@suid/material/AppBar'
import Box from '@suid/material/Box'
import Button from '@suid/material/Button'
import IconButton from '@suid/material/IconButton'
import Toolbar from '@suid/material/Toolbar'
import Typography from '@suid/material/Typography'
// import PlayArrowIcon from '@suid/icons-material/PlayArrow'
import { BiPlay as PlayArrowIcon } from 'solid-icons/bi'
// import SkipNextIcon from '@suid/icons-material/SkipNext'
import { BiSkipNext as SkipNextIcon } from 'solid-icons/bi'
// import SkipPreviousIcon from '@suid/icons-material/SkipPrevious'
import { BiSkipPrevious as SkipPreviousIcon } from 'solid-icons/bi'
import Card from '@suid/material/Card'
import CardContent from '@suid/material/CardContent'
import CardMedia from '@suid/material/CardMedia'
import useTheme from '@suid/material/styles/useTheme'
import Paper from '@suid/material/Paper'
import Breadcrumbs from '@suid/material/Breadcrumbs'
import Link from '@suid/material/Link'
import Modal from '@suid/material/Modal'

const theme = useTheme()
const [getOpen, setOpen] = createSignal(false)
const handleOpen = () => setOpen(true)
const handleClose = () => setOpen(false)

const App: Component = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='static'>
        <Toolbar>
          <IconButton size='large' edge='start' color='inherit' aria-label='menu' sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            News
          </Typography>
          <Button color='inherit'>Login</Button>
        </Toolbar>
      </AppBar>
      <div
        role='presentation'
        onClick={event => {
          console.info('You clicked a breadcrumb.')
          event.preventDefault()
        }}
      >
        <Breadcrumbs maxItems={2} aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='#' target='none'>
            Home
          </Link>
          <Link underline='hover' color='inherit' href='#' target='none'>
            Catalog
          </Link>
          <Link underline='hover' color='inherit' href='#' target='none'>
            Accessories
          </Link>
          <Link underline='hover' color='inherit' href='#' target='none'>
            New Collection
          </Link>
          <Typography color='text.primary'>Belts</Typography>
        </Breadcrumbs>
      </div>
      <Card sx={{ display: 'flex' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography component='div' variant='h5'>
              Live From Space
            </Typography>
            <Typography variant='subtitle1' color='text.secondary' component='div'>
              Mac Miller
            </Typography>
          </CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
            <IconButton aria-label='previous'>
              {theme.direction === 'rtl' ? <SkipNextIcon /> : <SkipPreviousIcon />}
            </IconButton>
            <IconButton aria-label='play/pause'>
              <PlayArrowIcon sx={{ height: 38, width: 38 }} />
            </IconButton>
            <IconButton aria-label='next'>
              {theme.direction === 'rtl' ? <SkipPreviousIcon /> : <SkipNextIcon />}
            </IconButton>
          </Box>
        </Box>
        <CardMedia
          component='img'
          sx={{ width: 151 }}
          image='https://mui.com/static/images/cards/live-from-space.jpg'
          alt='Live from space album cover'
        />
      </Card>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          '& > :not(style)': {
            m: 1,
            width: 128,
            height: 128,
          },
        }}
      >
        <Paper elevation={0} />
        <Paper />
        <Paper elevation={3} />
      </Box>
      <div>
        <Button onClick={handleOpen}>Open modal</Button>
        <Modal
          open={getOpen()}
          onClose={handleClose}
          aria-labelledby='modal-modal-title'
          aria-describedby='modal-modal-description'
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: theme.palette.background.paper,
              border: '2px solid #000',
              boxShadow: '24px',
              p: 4,
            }}
          >
            <Typography id='modal-modal-title' variant='h6' component='h2'>
              Text in a modal
            </Typography>
            <Typography id='modal-modal-description' sx={{ mt: 2 }}>
              Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
            </Typography>
          </Box>
        </Modal>
      </div>
    </Box>
  )
}

export default App
