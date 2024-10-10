'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar } from 'flowbite-react';

export function NavItems() {
	return (
		<>
			<Navbar.Link className="text-[17px]" href="/">
				Browse strategies
			</Navbar.Link>
			<Navbar.Link className="text-[17px]" href="/my-strategies">
				My strategies
			</Navbar.Link>
		</>
	);
}

export function Nav() {
	return (
		<Navbar fluid className="sticky top-0 border-b z-[100]">
			<div className="flex items-center gap-x-8">
				<Navbar.Brand href="/">
					<img src="/_images/raindex-logo.png" className="h-10 mr-2" />
				</Navbar.Brand>
				<Navbar.Collapse className="hidden md:visible">
					<NavItems />
				</Navbar.Collapse>
			</div>
			<div className="flex gap-x-2 md:order-1">
				<ConnectButton label="Connect" chainStatus="none" />
				<Navbar.Toggle />
			</div>
			<Navbar.Collapse className="md:hidden visible">
				<NavItems />
			</Navbar.Collapse>
		</Navbar>
	);
}
